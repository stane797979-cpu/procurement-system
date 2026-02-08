/**
 * AI 도구 정의 및 실행 모듈
 * Anthropic Claude Tool Calling 통합
 */

// 재고 도구
import {
  getInventoryStatusTool,
  executeGetInventoryStatus,
  calculateSafetyStockTool,
  executeCalculateSafetyStock,
} from "./inventory-tools";

// 발주 도구
import {
  getReorderRecommendationsTool,
  executeGetReorderRecommendations,
  getPurchaseOrderStatusTool,
  executeGetPurchaseOrderStatus,
} from "./order-tools";

// 분석 도구
import {
  getABCXYZAnalysisTool,
  executeGetABCXYZAnalysis,
  getDemandForecastTool,
  executeGetDemandForecast,
} from "./analysis-tools";

/**
 * 모든 도구 정의 (Anthropic API 형식)
 */
export const tools = [
  getInventoryStatusTool,
  calculateSafetyStockTool,
  getReorderRecommendationsTool,
  getPurchaseOrderStatusTool,
  getABCXYZAnalysisTool,
  getDemandForecastTool,
];

/**
 * 도구 실행 함수 매핑
 */
const toolExecutors: Record<string, (input: unknown) => Promise<unknown>> = {
  get_inventory_status: executeGetInventoryStatus as (input: unknown) => Promise<unknown>,
  calculate_safety_stock: executeCalculateSafetyStock as (input: unknown) => Promise<unknown>,
  get_reorder_recommendations: executeGetReorderRecommendations as (input: unknown) => Promise<unknown>,
  get_purchase_order_status: executeGetPurchaseOrderStatus as (input: unknown) => Promise<unknown>,
  get_abcxyz_analysis: executeGetABCXYZAnalysis as (input: unknown) => Promise<unknown>,
  get_demand_forecast: executeGetDemandForecast as (input: unknown) => Promise<unknown>,
};

/**
 * 도구 실행
 *
 * @param toolName - 도구 이름
 * @param input - 도구 입력 파라미터
 * @returns 도구 실행 결과
 */
export async function executeTool(
  toolName: string,
  input: unknown
): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  const executor = toolExecutors[toolName];

  if (!executor) {
    return {
      success: false,
      error: `알 수 없는 도구입니다: ${toolName}`,
    };
  }

  try {
    const result = await executor(input);
    return result as { success: boolean; data?: unknown; error?: string };
  } catch (error) {
    console.error(`도구 실행 오류 [${toolName}]:`, error);
    return {
      success: false,
      error: `도구 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    };
  }
}

/**
 * 도구 이름 목록
 */
export const toolNames = tools.map((t) => t.name);

/**
 * 도구 설명 가져오기
 */
export function getToolDescription(toolName: string): string | undefined {
  const tool = tools.find((t) => t.name === toolName);
  return tool?.description;
}

/**
 * 도구 스키마 가져오기
 */
export function getToolSchema(toolName: string): object | undefined {
  const tool = tools.find((t) => t.name === toolName);
  return tool?.input_schema;
}

// Re-export individual tools and executors for direct access
export {
  // 재고 도구
  getInventoryStatusTool,
  executeGetInventoryStatus,
  calculateSafetyStockTool,
  executeCalculateSafetyStock,
  // 발주 도구
  getReorderRecommendationsTool,
  executeGetReorderRecommendations,
  getPurchaseOrderStatusTool,
  executeGetPurchaseOrderStatus,
  // 분석 도구
  getABCXYZAnalysisTool,
  executeGetABCXYZAnalysis,
  getDemandForecastTool,
  executeGetDemandForecast,
};
