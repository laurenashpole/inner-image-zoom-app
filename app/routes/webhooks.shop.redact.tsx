import type { ActionFunctionArgs } from "react-router";

import { handleComplianceWebhook } from "../utils/compliance-webhook.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return handleComplianceWebhook(request, { deleteShopData: true });
};
