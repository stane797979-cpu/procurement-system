/**
 * AI 도구: 재고 관련 조회
 */

import { createClient } from '@/lib/supabase/server';

/**
 * 재고 현황 조회 도구
 */
export async function getInventoryStatus(params: {
  productCode?: string;
  status?: string;
  limit?: number;
}) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.user_metadata?.organizationId) {
      return { error: '인증된 사용자가 아닙니다.' };
    }

    const orgId = user.user_metadata.organizationId;

    // 기본 쿼리 구성
    let query = supabase
      .from('inventory')
      .select(
        `
        id,
        product_code,
        current_stock,
        status,
        safety_stock,
        reorder_point,
        products (
          product_code,
          product_name,
          unit,
          unit_price
        )
      `
      )
      .eq('organization_id', orgId);

    // 필터 적용
    if (params.productCode) {
      query = query.eq('product_code', params.productCode);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }

    query = query.limit(params.limit || 10);

    const { data, error } = await query;

    if (error) {
      return { error: `데이터베이스 오류: ${error.message}` };
    }

    // 응답 형식 정리
    const result = data.map((item: unknown) => {
      const itemData = item as Record<string, unknown>;
      // Supabase는 단일 조인도 배열로 반환할 수 있으므로 타입 단언
      const productData = itemData.products as unknown;
      const product = Array.isArray(productData) ? productData[0] : productData;
      const productRecord = product as Record<string, unknown> | undefined;

      return {
        productCode: itemData.product_code,
        productName: (productRecord?.product_name as string) || '알 수 없음',
        currentStock: itemData.current_stock,
        unit: (productRecord?.unit as string) || 'EA',
        status: itemData.status,
        safetyStock: itemData.safety_stock,
        reorderPoint: itemData.reorder_point,
        unitPrice: (productRecord?.unit_price as number) || 0,
        inventoryValue: ((itemData.current_stock as number) || 0) * ((productRecord?.unit_price as number) || 0),
      };
    });

    return {
      success: true,
      data: result,
      count: result.length,
    };
  } catch (error) {
    console.error('getInventoryStatus error:', error);
    return { error: '재고 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 제품별 재고 요약 정보
 */
export async function getProductInventorySummary(params: { productCode: string }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.user_metadata?.organizationId) {
      return { error: '인증된 사용자가 아닙니다.' };
    }

    const orgId = user.user_metadata.organizationId;

    // 재고 정보
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select(
        `
        *,
        products (*)
      `
      )
      .eq('organization_id', orgId)
      .eq('product_code', params.productCode)
      .single();

    if (invError || !inventory) {
      return { error: '해당 제품의 재고 정보를 찾을 수 없습니다.' };
    }

    // 최근 판매 데이터 (30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sales, error: salesError } = await supabase
      .from('sales_records')
      .select('quantity, date')
      .eq('organization_id', orgId)
      .eq('product_code', params.productCode)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (salesError) {
      console.error('Sales query error:', salesError);
    }

    const totalSales = sales?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
    const avgDailySales = totalSales / 30;

    // 재고일수 계산
    const daysOfInventory =
      avgDailySales > 0 ? (inventory.current_stock || 0) / avgDailySales : 999;

    return {
      success: true,
      data: {
        productCode: inventory.product_code,
        productName: inventory.products?.product_name || '알 수 없음',
        currentStock: inventory.current_stock,
        unit: inventory.products?.unit || 'EA',
        status: inventory.status,
        safetyStock: inventory.safety_stock,
        reorderPoint: inventory.reorder_point,
        unitPrice: inventory.products?.unit_price || 0,
        inventoryValue:
          (inventory.current_stock || 0) * (inventory.products?.unit_price || 0),
        salesLast30Days: totalSales,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        daysOfInventory: Math.round(daysOfInventory * 10) / 10,
        abcGrade: inventory.products?.abc_grade || 'N/A',
        xyzGrade: inventory.products?.xyz_grade || 'N/A',
        leadTime: inventory.products?.lead_time || 0,
      },
    };
  } catch (error) {
    console.error('getProductInventorySummary error:', error);
    return { error: '제품 재고 요약 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 재고 부족/과잉 품목 조회
 */
export async function getInventoryAlerts(params: { alertType?: 'shortage' | 'excess' }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.user_metadata?.organizationId) {
      return { error: '인증된 사용자가 아닙니다.' };
    }

    const orgId = user.user_metadata.organizationId;

    let query = supabase
      .from('inventory')
      .select(
        `
        *,
        products (*)
      `
      )
      .eq('organization_id', orgId);

    // 알림 유형별 필터
    if (params.alertType === 'shortage') {
      query = query.in('status', ['품절', '위험', '부족']);
    } else if (params.alertType === 'excess') {
      query = query.in('status', ['과다', '과잉']);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      return { error: `데이터베이스 오류: ${error.message}` };
    }

    const result = data.map((item) => ({
      productCode: item.product_code,
      productName: item.products?.product_name || '알 수 없음',
      currentStock: item.current_stock,
      unit: item.products?.unit || 'EA',
      status: item.status,
      safetyStock: item.safety_stock,
      reorderPoint: item.reorder_point,
      abcGrade: item.products?.abc_grade || 'N/A',
      recommendation:
        item.status === '품절' || item.status === '위험'
          ? '긴급 발주 필요'
          : item.status === '부족'
            ? '우선 발주 권장'
            : item.status === '과다' || item.status === '과잉'
              ? '판촉 또는 재고 조정 검토'
              : '정상',
    }));

    return {
      success: true,
      data: result,
      count: result.length,
    };
  } catch (error) {
    console.error('getInventoryAlerts error:', error);
    return { error: '재고 알림 조회 중 오류가 발생했습니다.' };
  }
}
