import { getReorderItems } from "@/server/actions/purchase-orders";
import { OrdersClient } from "./_components/orders-client";

export default async function OrdersPage() {
  let serverReorderItems: Awaited<ReturnType<typeof getReorderItems>>["items"] = [];
  try {
    const result = await getReorderItems();
    serverReorderItems = result.items;
  } catch (error) {
    console.error("발주 필요 품목 조회 오류:", error);
    serverReorderItems = [];
  }

  return <OrdersClient serverReorderItems={serverReorderItems} />;
}
