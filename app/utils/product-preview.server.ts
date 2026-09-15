type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

const GET_PREVIEW_PRODUCT = `#graphql
  query getPreviewProduct {
    products(first: 1, query: "status:active") {
      nodes {
        handle
        onlineStoreUrl
      }
    }
  }
`;

export async function getProductPreviewUrl(
  admin: AdminGraphql,
  shop: string,
) {
  const response = await admin.graphql(GET_PREVIEW_PRODUCT);
  const json = await response.json();
  const product = json.data?.products?.nodes?.[0];

  if (!product?.handle) {
    return null;
  }

  if (product.onlineStoreUrl) {
    return product.onlineStoreUrl as string;
  }

  return `https://${shop}/products/${product.handle}`;
}
