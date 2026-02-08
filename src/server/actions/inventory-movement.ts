"use server";

import { db } from "@/server/db";
import { inventoryHistory, products } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "./auth-helpers";
import {
  calculateDailyMovements,
  type ProductMovementSummary,
} from "@/server/services/inventory/movement-calculation";

export type { ProductMovementSummary };
export type { DailyMovement } from "@/server/services/inventory/movement-calculation";

interface MovementPeriod {
  startDate: string;
  endDate: string;
  totalInbound: number;
  totalOutbound: number;
  netChange: number;
  productCount: number;
}

/**
 * 수불부 데이터 조회
 *
 * inventory_history에서 기간 내 재고 변동을 조회하고
 * 제품별 일별 수불부를 계산하여 반환합니다.
 */
export async function getInventoryMovementData(options: {
  startDate: string;
  endDate: string;
  productId?: string;
}): Promise<{
  success: boolean;
  data?: {
    products: ProductMovementSummary[];
    period: MovementPeriod;
  };
  error?: string;
}> {
  try {
    const user = await requireAuth();

    const conditions = [
      eq(inventoryHistory.organizationId, user.organizationId),
      sql`${inventoryHistory.date} >= ${options.startDate}`,
      sql`${inventoryHistory.date} <= ${options.endDate}`,
    ];

    if (options.productId) {
      conditions.push(eq(inventoryHistory.productId, options.productId));
    }

    // 기간 내 모든 재고 변동 이력 조회
    const records = await db
      .select({
        record: inventoryHistory,
        product: {
          sku: products.sku,
          name: products.name,
        },
      })
      .from(inventoryHistory)
      .innerJoin(products, eq(inventoryHistory.productId, products.id))
      .where(and(...conditions))
      .orderBy(
        sql`${inventoryHistory.date} ASC, ${inventoryHistory.createdAt} ASC`
      );

    // MovementRecord 형태로 변환
    const movementRecords = records.map((row) => ({
      productId: row.record.productId,
      productSku: row.product.sku,
      productName: row.product.name,
      date: row.record.date,
      changeAmount: row.record.changeAmount,
      stockBefore: row.record.stockBefore,
      stockAfter: row.record.stockAfter,
      changeType: row.record.changeType,
    }));

    // 수불부 계산
    const productSummaries = calculateDailyMovements(
      movementRecords,
      options.startDate,
      options.endDate
    );

    // 기간 합계 계산
    let totalInbound = 0;
    let totalOutbound = 0;
    for (const summary of productSummaries) {
      totalInbound += summary.totalInbound;
      totalOutbound += summary.totalOutbound;
    }

    return {
      success: true,
      data: {
        products: productSummaries,
        period: {
          startDate: options.startDate,
          endDate: options.endDate,
          totalInbound,
          totalOutbound,
          netChange: totalInbound - totalOutbound,
          productCount: productSummaries.length,
        },
      },
    };
  } catch (error) {
    console.error("수불부 데이터 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "수불부 데이터 조회에 실패했습니다",
    };
  }
}
