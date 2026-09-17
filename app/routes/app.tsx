import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import {
  buildPricingPlansUrl,
  fetchActiveSubscription,
  isPartnerBillingConfigured,
} from "../partner-api.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, redirect, session } = await authenticate.admin(request);

  if (isPartnerBillingConfigured()) {
    const shopResponse = await admin.graphql(`{ shop { id } }`);
    const shopJson = (await shopResponse.json()) as {
      data?: { shop?: { id?: string } };
    };
    const shopId = shopJson.data?.shop?.id;

    if (!shopId) {
      throw new Error("Failed to resolve shop ID for billing check");
    }

    const subscription = await fetchActiveSubscription(shopId);

    if (!subscription) {
      return redirect(buildPricingPlansUrl(session.shop), { target: "_top" });
    }
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
      </s-app-nav>

      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
