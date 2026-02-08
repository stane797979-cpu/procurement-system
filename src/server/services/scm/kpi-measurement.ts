/**
 * KPI 실측 서비스
 * 조직의 실제 DB 데이터를 기반으로 7개 KPI를 계산합니다.
 */

import { db } from "@/server/db";
import {
  inventory,
  purchaseOrders,
  purchaseOrderItems,
  salesRecords,
  products,
} from "@/server/db/schema";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";
import type { KPIMetrics } from "./kpi-improvement";

/**
 * 월별 KPI 트렌드 데이터
 */
export interface KPITrend {
  month: string; // "2026-01"
  inventoryTurnoverRate: number;
  stockoutRate: number;
  onTimeOrderRate: number;
  orderFulfillmentRate: number;
}

/**
 * 조직의 실제 KPI 측정
 * @param organizationId 조직 ID
 * @returns 7개 KPI 지표
 */
export async function measureKPIMetrics(organizationId: string): Promise<KPIMetrics> {
  try {
    // 병렬로 모든 KPI 계산
    const [
      inventoryTurnoverRate,
      stockoutRate,
      onTimeOrderRate,
      averageLeadTime,
      orderFulfillmentRate,
    ] = await Promise.all([
      calculateInventoryTurnoverRate(organizationId),
      calculateStockoutRate(organizationId),
      calculateOnTimeOrderRate(organizationId),
      calculateAverageLeadTime(organizationId),
      calculateOrderFulfillmentRate(organizationId),
    ]);

    // 재고회전율 기반 평균 재고일수 계산
    const averageInventoryDays =
      inventoryTurnoverRate > 0 ? 365 / inventoryTurnoverRate : 999;

    // 재고 정확도는 실사 데이터가 없으므로 고정값
    const inventoryAccuracy = 95.0;

    return {
      inventoryTurnoverRate,
      averageInventoryDays,
      inventoryAccuracy,
      stockoutRate,
      onTimeOrderRate,
      averageLeadTime,
      orderFulfillmentRate,
    };
  } catch (error) {
    console.error("[measureKPIMetrics] Error:", error);
    // 에러 발생 시 기본값 반환
    return {
      inventoryTurnoverRate: 0,
      averageInventoryDays: 999,
      inventoryAccuracy: 95.0,
      stockoutRate: 0,
      onTimeOrderRate: 0,
      averageLeadTime: 0,
      orderFulfillmentRate: 0,
    };
  }
}

/**
 * 재고회전율 계산
 * 공식: 연간 매출원가(COGS) / 평균 재고금액
 * @param organizationId 조직 ID
 * @returns 재고회전율 (회/년)
 */
async function calculateInventoryTurnoverRate(organizationId: string): Promise<number> {
  try {
    // 1. 연간 매출원가(COGS) 계산 - 최근 12개월 판매 데이터
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split("T")[0];

    // salesRecords에서 총 매출원가(COGS) 계산
    // COGS = 판매수량 × 원가(costPrice). unitPrice는 판매가이므로 사용하지 않음
    const salesData = await db
      .select({
        totalCOGS: sql<number>`
          COALESCE(
            SUM(
              ${salesRecords.quantity} *
              COALESCE(${products.costPrice}, 0)
            ),
            0
          )
        `.as("total_cogs"),
      })
      .from(salesRecords)
      .leftJoin(products, eq(salesRecords.productId, products.id))
      .where(
        and(eq(salesRecords.organizationId, organizationId), gte(salesRecords.date, oneYearAgoStr))
      )
      .execute();

    const annualCOGS = Number(salesData[0]?.totalCOGS) || 0;

    // 2. 평균 재고금액 계산
    const inventoryData = await db
      .select({
        avgInventoryValue: sql<number>`COALESCE(AVG(${inventory.inventoryValue}), 0)`.as(
          "avg_inventory_value"
        ),
      })
      .from(inventory)
      .where(eq(inventory.organizationId, organizationId))
      .execute();

    const avgInventoryValue = Number(inventoryData[0]?.avgInventoryValue) || 0;

    // 3. 재고회전율 계산
    if (avgInventoryValue === 0 || annualCOGS === 0) {
      return 0;
    }

    return Math.round((annualCOGS / avgInventoryValue) * 100) / 100;
  } catch (error) {
    console.error("[calculateInventoryTurnoverRate] Error:", error);
    return 0;
  }
}

/**
 * 품절률 계산
 * 공식: 품절 SKU 수 / 전체 활성 SKU 수 * 100
 * @param organizationId 조직 ID
 * @returns 품절률 (%)
 */
async function calculateStockoutRate(organizationId: string): Promise<number> {
  try {
    const result = await db
      .select({
        totalCount: sql<number>`COUNT(*)`.as("total_count"),
        stockoutCount: sql<number>`COUNT(*) FILTER (WHERE ${inventory.status} = 'out_of_stock')`.as(
          "stockout_count"
        ),
      })
      .from(inventory)
      .where(eq(inventory.organizationId, organizationId))
      .execute();

    const totalCount = Number(result[0]?.totalCount) || 0;
    const stockoutCount = Number(result[0]?.stockoutCount) || 0;

    if (totalCount === 0) {
      return 0;
    }

    return Math.round((stockoutCount / totalCount) * 10000) / 100;
  } catch (error) {
    console.error("[calculateStockoutRate] Error:", error);
    return 0;
  }
}

/**
 * 적시 발주율 계산
 * 공식: 예상일 이내 입고된 발주 건수 / 전체 완료 발주 건수 * 100
 * @param organizationId 조직 ID
 * @returns 적시 발주율 (%)
 */
async function calculateOnTimeOrderRate(organizationId: string): Promise<number> {
  try {
    const result = await db
      .select({
        totalCount: sql<number>`COUNT(*)`.as("total_count"),
        onTimeCount: sql<number>`
          COUNT(*) FILTER (
            WHERE ${purchaseOrders.actualDate} IS NOT NULL
            AND ${purchaseOrders.expectedDate} IS NOT NULL
            AND ${purchaseOrders.actualDate} <= ${purchaseOrders.expectedDate}
          )
        `.as("on_time_count"),
      })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organizationId),
          inArray(purchaseOrders.status, ["received", "completed"])
        )
      )
      .execute();

    const totalCount = Number(result[0]?.totalCount) || 0;
    const onTimeCount = Number(result[0]?.onTimeCount) || 0;

    if (totalCount === 0) {
      return 0;
    }

    return Math.round((onTimeCount / totalCount) * 10000) / 100;
  } catch (error) {
    console.error("[calculateOnTimeOrderRate] Error:", error);
    return 0;
  }
}

/**
 * 평균 리드타임 계산
 * 공식: 평균(actualDate - orderDate)
 * @param organizationId 조직 ID
 * @returns 평균 리드타임 (일)
 */
async function calculateAverageLeadTime(organizationId: string): Promise<number> {
  try {
    const result = await db
      .select({
        avgLeadTime: sql<number>`
          COALESCE(
            AVG(${purchaseOrders.actualDate}::date - ${purchaseOrders.orderDate}::date),
            0
          )
        `.as("avg_lead_time"),
      })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organizationId),
          inArray(purchaseOrders.status, ["received", "completed"]),
          sql`${purchaseOrders.actualDate} IS NOT NULL`,
          sql`${purchaseOrders.orderDate} IS NOT NULL`
        )
      )
      .execute();

    return Math.round(Number(result[0]?.avgLeadTime) || 0);
  } catch (error) {
    console.error("[calculateAverageLeadTime] Error:", error);
    return 0;
  }
}

/**
 * 발주 충족률 계산
 * 공식: 총 입고수량 / 총 발주수량 * 100
 * @param organizationId 조직 ID
 * @returns 발주 충족률 (%)
 */
async function calculateOrderFulfillmentRate(organizationId: string): Promise<number> {
  try {
    // 완료된 발주의 항목들만 대상
    const completedOrderIds = await db
      .select({ id: purchaseOrders.id })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organizationId),
          inArray(purchaseOrders.status, ["received", "completed"])
        )
      )
      .execute();

    if (completedOrderIds.length === 0) {
      return 0;
    }

    const orderIds = completedOrderIds.map((o) => o.id);

    const result = await db
      .select({
        totalOrdered: sql<number>`COALESCE(SUM(${purchaseOrderItems.quantity}), 0)`.as(
          "total_ordered"
        ),
        totalReceived: sql<number>`COALESCE(SUM(${purchaseOrderItems.receivedQuantity}), 0)`.as(
          "total_received"
        ),
      })
      .from(purchaseOrderItems)
      .where(inArray(purchaseOrderItems.purchaseOrderId, orderIds))
      .execute();

    const totalOrdered = Number(result[0]?.totalOrdered) || 0;
    const totalReceived = Number(result[0]?.totalReceived) || 0;

    if (totalOrdered === 0) {
      return 0;
    }

    return Math.round((totalReceived / totalOrdered) * 10000) / 100;
  } catch (error) {
    console.error("[calculateOrderFulfillmentRate] Error:", error);
    return 0;
  }
}

/**
 * 월별 KPI 트렌드 데이터 생성
 * @param organizationId 조직 ID
 * @param months 조회할 개월 수 (기본 6개월)
 * @returns 월별 KPI 트렌드
 */
export async function getKPITrendData(
  organizationId: string,
  months: number = 6
): Promise<KPITrend[]> {
  try {
    const trends: KPITrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;

      // 해당 월의 시작일과 종료일
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      const monthStartStr = monthStart.toISOString().split("T")[0];
      const monthEndStr = monthEnd.toISOString().split("T")[0];

      // 해당 월의 KPI 계산
      const [inventoryTurnoverRate, stockoutRate, onTimeOrderRate, orderFulfillmentRate] =
        await Promise.all([
          calculateMonthlyInventoryTurnoverRate(organizationId, monthStartStr, monthEndStr),
          calculateMonthlyStockoutRate(organizationId, monthEndStr),
          calculateMonthlyOnTimeOrderRate(organizationId, monthStartStr, monthEndStr),
          calculateMonthlyOrderFulfillmentRate(organizationId, monthStartStr, monthEndStr),
        ]);

      trends.push({
        month: monthStr,
        inventoryTurnoverRate,
        stockoutRate,
        onTimeOrderRate,
        orderFulfillmentRate,
      });
    }

    return trends;
  } catch (error) {
    console.error("[getKPITrendData] Error:", error);
    return [];
  }
}

/**
 * 월간 재고회전율 계산
 * @param organizationId 조직 ID
 * @param startDate 시작일 (YYYY-MM-DD)
 * @param endDate 종료일 (YYYY-MM-DD)
 * @returns 재고회전율 (연간 환산)
 */
async function calculateMonthlyInventoryTurnoverRate(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  try {
    // 해당 월의 매출원가 (COGS = 판매수량 × 원가)
    const salesData = await db
      .select({
        totalCOGS: sql<number>`
          COALESCE(
            SUM(
              ${salesRecords.quantity} *
              COALESCE(${products.costPrice}, 0)
            ),
            0
          )
        `.as("total_cogs"),
      })
      .from(salesRecords)
      .leftJoin(products, eq(salesRecords.productId, products.id))
      .where(
        and(
          eq(salesRecords.organizationId, organizationId),
          gte(salesRecords.date, startDate),
          lte(salesRecords.date, endDate)
        )
      )
      .execute();

    const monthlyCOGS = Number(salesData[0]?.totalCOGS) || 0;

    // 해당 월말 평균 재고금액
    const inventoryData = await db
      .select({
        avgInventoryValue: sql<number>`COALESCE(AVG(${inventory.inventoryValue}), 0)`.as(
          "avg_inventory_value"
        ),
      })
      .from(inventory)
      .where(eq(inventory.organizationId, organizationId))
      .execute();

    const avgInventoryValue = Number(inventoryData[0]?.avgInventoryValue) || 0;

    if (avgInventoryValue === 0 || monthlyCOGS === 0) {
      return 0;
    }

    // 월간 회전율을 연간으로 환산 (× 12)
    return Math.round(((monthlyCOGS / avgInventoryValue) * 12) * 100) / 100;
  } catch (error) {
    console.error("[calculateMonthlyInventoryTurnoverRate] Error:", error);
    return 0;
  }
}

/**
 * 월말 기준 품절률 계산
 * @param organizationId 조직 ID
 * @param endDate 월말일 (YYYY-MM-DD)
 * @returns 품절률 (%)
 */
async function calculateMonthlyStockoutRate(
  organizationId: string,
  endDate: string
): Promise<number> {
  // 현재는 실시간 재고 상태만 있으므로 전체 품절률 반환
  // TODO: 향후 inventoryHistory를 활용하여 특정 시점의 품절률 계산 가능
  return calculateStockoutRate(organizationId);
}

/**
 * 월간 적시 발주율 계산
 * @param organizationId 조직 ID
 * @param startDate 시작일 (YYYY-MM-DD)
 * @param endDate 종료일 (YYYY-MM-DD)
 * @returns 적시 발주율 (%)
 */
async function calculateMonthlyOnTimeOrderRate(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  try {
    const result = await db
      .select({
        totalCount: sql<number>`COUNT(*)`.as("total_count"),
        onTimeCount: sql<number>`
          COUNT(*) FILTER (
            WHERE ${purchaseOrders.actualDate} IS NOT NULL
            AND ${purchaseOrders.expectedDate} IS NOT NULL
            AND ${purchaseOrders.actualDate} <= ${purchaseOrders.expectedDate}
          )
        `.as("on_time_count"),
      })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organizationId),
          inArray(purchaseOrders.status, ["received", "completed"]),
          gte(purchaseOrders.actualDate, startDate),
          lte(purchaseOrders.actualDate, endDate)
        )
      )
      .execute();

    const totalCount = Number(result[0]?.totalCount) || 0;
    const onTimeCount = Number(result[0]?.onTimeCount) || 0;

    if (totalCount === 0) {
      return 0;
    }

    return Math.round((onTimeCount / totalCount) * 10000) / 100;
  } catch (error) {
    console.error("[calculateMonthlyOnTimeOrderRate] Error:", error);
    return 0;
  }
}

/**
 * 월간 발주 충족률 계산
 * @param organizationId 조직 ID
 * @param startDate 시작일 (YYYY-MM-DD)
 * @param endDate 종료일 (YYYY-MM-DD)
 * @returns 발주 충족률 (%)
 */
async function calculateMonthlyOrderFulfillmentRate(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  try {
    const completedOrderIds = await db
      .select({ id: purchaseOrders.id })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organizationId),
          inArray(purchaseOrders.status, ["received", "completed"]),
          gte(purchaseOrders.actualDate, startDate),
          lte(purchaseOrders.actualDate, endDate)
        )
      )
      .execute();

    if (completedOrderIds.length === 0) {
      return 0;
    }

    const orderIds = completedOrderIds.map((o) => o.id);

    const result = await db
      .select({
        totalOrdered: sql<number>`COALESCE(SUM(${purchaseOrderItems.quantity}), 0)`.as(
          "total_ordered"
        ),
        totalReceived: sql<number>`COALESCE(SUM(${purchaseOrderItems.receivedQuantity}), 0)`.as(
          "total_received"
        ),
      })
      .from(purchaseOrderItems)
      .where(inArray(purchaseOrderItems.purchaseOrderId, orderIds))
      .execute();

    const totalOrdered = Number(result[0]?.totalOrdered) || 0;
    const totalReceived = Number(result[0]?.totalReceived) || 0;

    if (totalOrdered === 0) {
      return 0;
    }

    return Math.round((totalReceived / totalOrdered) * 10000) / 100;
  } catch (error) {
    console.error("[calculateMonthlyOrderFulfillmentRate] Error:", error);
    return 0;
  }
}
