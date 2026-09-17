import { APP_EMBED_HANDLE } from "./theme-editor.server";

export type EmbedStatus = "enabled" | "disabled" | "not_added" | "unknown";

type ThemeBlock = {
  type?: string;
  disabled?: boolean;
};

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

const GET_MAIN_THEME = `#graphql
  query getMainTheme {
    themes(first: 1, roles: [MAIN]) {
      nodes {
        id
        name
      }
    }
  }
`;

// Read-only: detect whether the app embed is enabled. Does not write theme files.
const GET_SETTINGS_DATA = `#graphql
  query getSettingsData($themeId: ID!) {
    theme(id: $themeId) {
      files(filenames: ["config/settings_data.json"], first: 1) {
        nodes {
          body {
            ... on OnlineStoreThemeFileBodyText {
              content
            }
          }
        }
      }
    }
  }
`;

export function parseEmbedStatus(settingsContent: string): EmbedStatus {
  const cleaned = settingsContent.replace(/\/\*[\s\S]*?\*\//, "").trim();

  if (!cleaned) {
    return "not_added";
  }

  let parsed: { current?: { blocks?: Record<string, ThemeBlock> } };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return "unknown";
  }

  const blocks = parsed?.current?.blocks;

  if (!blocks) {
    return "not_added";
  }

  for (const block of Object.values(blocks)) {
    const type = block?.type || "";

    if (type.includes(`/blocks/${APP_EMBED_HANDLE}/`)) {
      return block.disabled === true ? "disabled" : "enabled";
    }
  }

  return "not_added";
}

export async function getEmbedStatus(admin: AdminGraphql) {
  const themeResponse = await admin.graphql(GET_MAIN_THEME);
  const themeJson = await themeResponse.json();
  const mainTheme = themeJson.data?.themes?.nodes?.[0];

  if (!mainTheme?.id) {
    return {
      embedStatus: "unknown" as EmbedStatus,
      themeName: null,
      themeId: null,
    };
  }

  const settingsResponse = await admin.graphql(GET_SETTINGS_DATA, {
    variables: { themeId: mainTheme.id },
  });
  const settingsJson = await settingsResponse.json();
  const settingsContent =
    settingsJson.data?.theme?.files?.nodes?.[0]?.body?.content ?? "";

  return {
    embedStatus: parseEmbedStatus(settingsContent),
    themeName: mainTheme.name as string,
    themeId: mainTheme.id as string,
  };
}
