import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import type { EmbedStatus } from "../utils/embed-status.server";
import { getEmbedStatus } from "../utils/embed-status.server";
import { getProductPreviewUrl } from "../utils/product-preview.server";
import { buildAppEmbedDeepLink } from "../utils/theme-editor.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const { embedStatus, themeName, themeId } = await getEmbedStatus(
    admin,
    apiKey,
  );

  const productPreviewUrl =
    embedStatus === "enabled"
      ? await getProductPreviewUrl(admin, session.shop)
      : null;

  return {
    embedDeepLink: buildAppEmbedDeepLink(session.shop, apiKey, themeId),
    embedStatus,
    productPreviewUrl,
    themeName,
  };
};

function EmbedStatusBanner({
  status,
  themeName,
}: {
  status: EmbedStatus;
  themeName: string | null;
}) {
  const themeLabel = themeName ? ` (${themeName})` : "";

  if (status === "enabled") {
    return (
      <s-banner tone="success" heading="App embed enabled">
        Inner Image Zoom is active on your live theme{themeLabel}.
      </s-banner>
    );
  }

  if (status === "disabled") {
    return (
      <s-banner tone="warning" heading="App embed disabled">
        Inner Image Zoom is turned off on your live theme{themeLabel}. Open
        the theme editor and enable it under App embeds.
      </s-banner>
    );
  }

  if (status === "not_added") {
    return (
      <s-banner tone="warning" heading="App embed not enabled">
        Enable Inner Image Zoom in your theme{themeLabel} to add zoom to
        product pages.
      </s-banner>
    );
  }

  return (
    <s-banner tone="info" heading="Could not verify embed status">
      Open the theme editor and confirm Inner Image Zoom is enabled under App
      embeds.
    </s-banner>
  );
}

export default function Index() {
  const { embedDeepLink, embedStatus, productPreviewUrl, themeName } =
    useLoaderData<typeof loader>();
  const showEnableAction = embedStatus !== "enabled";

  return (
    <s-page heading="Inner Image Zoom">
      {productPreviewUrl && (
        <s-button
          slot="primary-action"
          href={productPreviewUrl}
          target="_blank"
          variant="primary"
        >
          Preview on storefront
        </s-button>
      )}

      {showEnableAction && (
        <s-button
          slot="primary-action"
          href={embedDeepLink}
          target="_blank"
          variant="primary"
        >
          Enable in theme editor
        </s-button>
      )}

      <s-section>
        <EmbedStatusBanner status={embedStatus} themeName={themeName} />
      </s-section>

      <s-section heading="Get started">
        <s-paragraph>
          Allow shoppers to magnify photos inside the product image — no
          gallery replacement required. Once the app embed is enabled,
          Inner Image Zoom is automatically added to product pages.
        </s-paragraph>
      </s-section>

      <s-section heading="Setup">
        <s-stack gap="base">
          <s-ordered-list>
            <s-list-item>
              <s-text type="strong">Enable the app embed.</s-text> Click{" "}
              <s-text type="strong">Enable in theme editor</s-text> above. In
              Theme settings → App embeds, turn on{" "}
              <s-text type="strong">Inner Image Zoom</s-text>, then save.
            </s-list-item>

            <s-list-item>
              <s-text type="strong">Configure zoom settings.</s-text> In the theme editor, adjust trigger (click or hover), mobile
              fullscreen, zoom scale, and preload in the app embed settings.
            </s-list-item>

            <s-list-item>
              <s-text type="strong">Preview a product page.</s-text>{" "}
              {productPreviewUrl ? (
                <>
                  Open a product on your storefront and click or hover the main
                  image to test zoom.
                </>
              ) : (
                <>
                  Open any product on your storefront and click or hover the main
                  image to zoom.
                </>
              )}
            </s-list-item>
          </s-ordered-list>

          <s-stack direction="inline" gap="base">
            {productPreviewUrl && (
              <s-button href={productPreviewUrl} target="_blank">
                Preview on storefront
              </s-button>
            )}

            {showEnableAction && (
              <s-button href={embedDeepLink} target="_blank">
                Open theme editor
              </s-button>
            )}
          </s-stack>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Where settings live">
        <s-paragraph>
          Zoom behavior is configured in the{" "}
          <s-text type="strong">theme editor</s-text> under App embeds, not in
          this app. That lets you preview changes before publishing.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Tips">
        <s-unordered-list>
          <s-list-item>
            Use <s-text type="strong">hover</s-text> zoom if your theme already
            opens images in a lightbox on click. If you use{" "}
            <s-text type="strong">click</s-text> zoom, turn off the theme&apos;s
            image zoom or lightbox to avoid conflicts.
          </s-list-item>

          <s-list-item>
            Enable <s-text type="strong">fullscreen on mobile</s-text> for
            easier zoom on touch devices.
          </s-list-item>

          <s-list-item>
            Keep <s-text type="strong">preload zoom image</s-text> off for
            faster initial page loads.
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
