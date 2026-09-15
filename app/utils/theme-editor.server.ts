export const APP_EMBED_HANDLE = "inner-image-zoom";

export function themeGidToEditorId(themeGid: string) {
  return themeGid.split("/").pop() || "current";
}

export function buildAppEmbedDeepLink(
  shop: string,
  apiKey: string,
  themeGid?: string | null,
) {
  const shopHandle = shop.replace(/\.myshopify\.com$/, "");
  const themeId = themeGid ? themeGidToEditorId(themeGid) : "current";
  const params = new URLSearchParams({
    context: "apps",
    template: "product",
    activateAppId: `${apiKey}/${APP_EMBED_HANDLE}`,
  });

  return `https://admin.shopify.com/store/${shopHandle}/themes/${themeId}/editor?${params.toString()}`;
}
