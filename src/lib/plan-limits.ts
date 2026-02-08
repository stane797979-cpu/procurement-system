/**
 * 플랜별 제한 체크 유틸리티
 *
 * 사용 예시:
 * ```ts
 * const limits = getPlanLimits('starter');
 * const canAddProduct = await checkLimit(orgId, 'products');
 * ```
 */

import { db } from "@/server/db";
import { organizations, products, users, purchaseOrders } from "@/server/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type PlanLimits,
} from "@/types/subscription";

/**
 * 플랜 제한 조회
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return SUBSCRIPTION_PLANS[plan].limits;
}

/**
 * 리소스 타입
 */
export type ResourceType = "products" | "users" | "orders" | "aiChat" | "aiToolCall";

/**
 * 현재 사용량 조회
 */
async function getCurrentUsage(
  organizationId: string,
  resourceType: ResourceType,
): Promise<number> {
  try {
    switch (resourceType) {
      case "products": {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.organizationId, organizationId));
        return Number(result[0]?.count || 0);
      }

      case "users": {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.organizationId, organizationId));
        return Number(result[0]?.count || 0);
      }

      case "orders": {
        // 이번 달 발주 건수
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(purchaseOrders)
          .where(
            and(
              eq(purchaseOrders.organizationId, organizationId),
              gte(purchaseOrders.createdAt, startOfMonth),
            ),
          );
        return Number(result[0]?.count || 0);
      }

      case "aiChat": {
        // TODO: AI 채팅 사용량 추적 테이블 구현 후 실제 조회
        // 현재는 0 반환 (무제한)
        return 0;
      }

      case "aiToolCall": {
        // TODO: AI 도구 호출 사용량 추적 테이블 구현 후 실제 조회
        return 0;
      }

      default:
        return 0;
    }
  } catch (error) {
    console.error("[PlanLimits] 사용량 조회 오류:", error);
    return 0;
  }
}

/**
 * 플랜 제한 체크
 */
export async function checkLimit(
  organizationId: string,
  resourceType: ResourceType,
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  try {
    // 조직 플랜 조회
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) {
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }

    const limits = getPlanLimits(org.plan as SubscriptionPlan);
    const current = await getCurrentUsage(organizationId, resourceType);

    let limit = 0;
    switch (resourceType) {
      case "products":
        limit = limits.maxProducts;
        break;
      case "users":
        limit = limits.maxUsers;
        break;
      case "orders":
        limit = limits.maxOrders;
        break;
      case "aiChat":
        limit = limits.aiChatLimit;
        break;
      case "aiToolCall":
        limit = limits.aiToolCallLimit;
        break;
    }

    const allowed = current < limit;
    const remaining = Math.max(0, limit - current);

    return { allowed, current, limit, remaining };
  } catch (error) {
    console.error("[PlanLimits] 제한 체크 오류:", error);
    return { allowed: false, current: 0, limit: 0, remaining: 0 };
  }
}

/**
 * 기능 사용 가능 여부 체크
 */
export async function checkFeature(
  organizationId: string,
  feature:
    | "abcxyz"
    | "demandForecast"
    | "simulation"
    | "api"
    | "advancedAnalytics"
    | "prioritySupport",
): Promise<boolean> {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) return false;

    const limits = getPlanLimits(org.plan as SubscriptionPlan);

    switch (feature) {
      case "abcxyz":
        return limits.hasABCXYZ;
      case "demandForecast":
        return limits.hasDemandForecast;
      case "simulation":
        return limits.hasSimulation;
      case "api":
        return limits.hasAPIAccess;
      case "advancedAnalytics":
        return limits.hasAdvancedAnalytics;
      case "prioritySupport":
        return limits.hasPrioritySupport;
      default:
        return false;
    }
  } catch (error) {
    console.error("[PlanLimits] 기능 체크 오류:", error);
    return false;
  }
}

/**
 * 사용량 요약 조회
 */
export async function getUsageSummary(organizationId: string): Promise<{
  plan: SubscriptionPlan;
  limits: PlanLimits;
  usage: {
    products: { current: number; limit: number; percentage: number };
    users: { current: number; limit: number; percentage: number };
    orders: { current: number; limit: number; percentage: number };
    aiChat: { current: number; limit: number; percentage: number };
  };
}> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  const plan = (org?.plan as SubscriptionPlan) || "free";
  const limits = getPlanLimits(plan);

  const productsUsage = await getCurrentUsage(organizationId, "products");
  const usersUsage = await getCurrentUsage(organizationId, "users");
  const ordersUsage = await getCurrentUsage(organizationId, "orders");
  const aiChatUsage = await getCurrentUsage(organizationId, "aiChat");

  return {
    plan,
    limits,
    usage: {
      products: {
        current: productsUsage,
        limit: limits.maxProducts,
        percentage: Math.min(100, (productsUsage / limits.maxProducts) * 100),
      },
      users: {
        current: usersUsage,
        limit: limits.maxUsers,
        percentage: Math.min(100, (usersUsage / limits.maxUsers) * 100),
      },
      orders: {
        current: ordersUsage,
        limit: limits.maxOrders,
        percentage:
          limits.maxOrders >= 99999
            ? 0
            : Math.min(100, (ordersUsage / limits.maxOrders) * 100),
      },
      aiChat: {
        current: aiChatUsage,
        limit: limits.aiChatLimit,
        percentage:
          limits.aiChatLimit >= 99999
            ? 0
            : Math.min(100, (aiChatUsage / limits.aiChatLimit) * 100),
      },
    },
  };
}
