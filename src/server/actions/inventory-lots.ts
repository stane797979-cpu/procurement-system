"use server";

import { db } from "@/server/db";
import { inventoryLots, products } from "@/server/db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { requireAuth } from "./auth-helpers";

export interface InventoryLotItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  lotNumber: string;
  expiryDate: string | null;
  initialQuantity: number;
  remainingQuantity: number;
  receivedDate: string;
  status: "active" | "depleted" | "expired";
  createdAt: Date;
}

/**
 * 제품별 Lot 재고 현황 조회
 */
export async function getInventoryLots(options?: {
  productId?: string;
  status?: "active" | "depleted" | "expired";
  limit?: number;
  offset?: number;
}): Promise<{ lots: InventoryLotItem[]; total: number }> {
  const user = await requireAuth();
  const { productId, status, limit = 100, offset = 0 } = options || {};

  const conditions = [eq(inventoryLots.organizationId, user.organizationId)];

  if (productId) {
    conditions.push(eq(inventoryLots.productId, productId));
  }
  if (status) {
    conditions.push(eq(inventoryLots.status, status));
  }

  const [lots, countResult] = await Promise.all([
    db
      .select({
        lot: inventoryLots,
        product: {
          sku: products.sku,
          name: products.name,
        },
      })
      .from(inventoryLots)
      .innerJoin(products, eq(inventoryLots.productId, products.id))
      .where(and(...conditions))
      .orderBy(
        sql`${inventoryLots.expiryDate} ASC NULLS LAST`,
        desc(inventoryLots.remainingQuantity)
      )
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLots)
      .where(and(...conditions)),
  ]);

  return {
    lots: lots.map((row) => ({
      id: row.lot.id,
      productId: row.lot.productId,
      productSku: row.product.sku,
      productName: row.product.name,
      lotNumber: row.lot.lotNumber,
      expiryDate: row.lot.expiryDate,
      initialQuantity: row.lot.initialQuantity,
      remainingQuantity: row.lot.remainingQuantity,
      receivedDate: row.lot.receivedDate,
      status: row.lot.status,
      createdAt: row.lot.createdAt,
    })),
    total: Number(countResult[0]?.count || 0),
  };
}

/**
 * Lot 현황 요약 (만료 임박, 만료됨 등)
 */
export async function getLotSummary(): Promise<{
  totalActiveLots: number;
  expiringSoon: number; // 7일 이내 만료
  expired: number;
  totalLotQuantity: number;
}> {
  const user = await requireAuth();
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [activeResult, expiringSoonResult, expiredResult] = await Promise.all([
    // 활성 Lot 수 + 총 잔여수량
    db
      .select({
        count: sql<number>`count(*)`,
        totalQty: sql<number>`coalesce(sum(${inventoryLots.remainingQuantity}), 0)`,
      })
      .from(inventoryLots)
      .where(
        and(
          eq(inventoryLots.organizationId, user.organizationId),
          eq(inventoryLots.status, "active"),
          gt(inventoryLots.remainingQuantity, 0)
        )
      ),
    // 7일 이내 만료 임박
    db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLots)
      .where(
        and(
          eq(inventoryLots.organizationId, user.organizationId),
          eq(inventoryLots.status, "active"),
          gt(inventoryLots.remainingQuantity, 0),
          sql`${inventoryLots.expiryDate} IS NOT NULL`,
          sql`${inventoryLots.expiryDate} > ${today}`,
          sql`${inventoryLots.expiryDate} <= ${sevenDaysLater}`
        )
      ),
    // 이미 만료됨 (active이지만 유통기한 지남)
    db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLots)
      .where(
        and(
          eq(inventoryLots.organizationId, user.organizationId),
          eq(inventoryLots.status, "active"),
          gt(inventoryLots.remainingQuantity, 0),
          sql`${inventoryLots.expiryDate} IS NOT NULL`,
          sql`${inventoryLots.expiryDate} < ${today}`
        )
      ),
  ]);

  return {
    totalActiveLots: Number(activeResult[0]?.count || 0),
    expiringSoon: Number(expiringSoonResult[0]?.count || 0),
    expired: Number(expiredResult[0]?.count || 0),
    totalLotQuantity: Number(activeResult[0]?.totalQty || 0),
  };
}
