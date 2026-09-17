export const APP_HANDLE = "inner-image-zoom-app";

const SUBSCRIPTION_CACHE_TTL_MS = 5 * 60 * 1000;

type ActiveSubscription = {
  billingPeriod: string;
};

const subscriptionCache = new Map<
  string,
  { value: ActiveSubscription; expiresAt: number }
>();

function getPartnerApiConfig() {
  return {
    orgId: process.env.SHOPIFY_PARTNER_ORG_ID,
    accessToken: process.env.SHOPIFY_PARTNER_API_ACCESS_TOKEN,
    appId: process.env.SHOPIFY_APP_GID,
  };
}

export function isPartnerBillingConfigured() {
  const { orgId, accessToken, appId } = getPartnerApiConfig();
  return Boolean(orgId && accessToken && appId);
}

export function buildPricingPlansUrl(shop: string) {
  const storeHandle = shop.replace(/\.myshopify\.com$/, "");
  return `https://admin.shopify.com/store/${storeHandle}/charges/${APP_HANDLE}/pricing_plans`;
}

export async function fetchActiveSubscription(
  shopId: string,
): Promise<ActiveSubscription | null> {
  const cached = subscriptionCache.get(shopId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const { orgId, accessToken, appId } = getPartnerApiConfig();

  if (!orgId || !accessToken || !appId) {
    throw new Error("Partner API billing is not configured");
  }

  const res = await fetch(
    `https://partners.shopify.com/${orgId}/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: `query ($appId: ID!, $shopId: ID!) {
          activeSubscription(appId: $appId, shopId: $shopId) {
            billingPeriod
          }
        }`,
        variables: { appId, shopId },
      }),
    },
  );

  const { data, errors } = (await res.json()) as {
    data?: { activeSubscription: ActiveSubscription | null };
    errors?: unknown;
  };

  if (!res.ok || errors) {
    throw new Error(
      `Partner API request failed: ${JSON.stringify(errors ?? res.status)}`,
    );
  }

  const subscription = data?.activeSubscription ?? null;

  if (subscription) {
    subscriptionCache.set(shopId, {
      value: subscription,
      expiresAt: Date.now() + SUBSCRIPTION_CACHE_TTL_MS,
    });
  }

  return subscription;
}
