import { authenticate } from "../shopify.server";
import db from "../db.server";

type ComplianceWebhookOptions = {
  deleteShopData?: boolean;
};

export async function handleComplianceWebhook(
  request: Request,
  { deleteShopData = false }: ComplianceWebhookOptions = {},
) {
  const { topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} compliance webhook for ${shop}`);

  if (deleteShopData) {
    await db.session.deleteMany({ where: { shop } });
  }

  return new Response();
}
