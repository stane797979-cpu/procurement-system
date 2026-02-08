/**
 * AI 도구: 발주 관련 조회 및 추천
 */

import { createClient } from '@/lib/supabase/server';

/**
 * 발주 필요 품목 조회
 */
export async function getReorderRecommendations(params: { limit?: number; minScore?: number }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.user_metadata?.organizationId) {
      return { error: '인증된 사용자가 아닙니다.' };
    }

    const orgId = user.user_metadata.organizationId;

    // 재고가 발주점 이하인 품목 조회
    const { data, error } = await supabase
      .from('inventory')
      .select(
        `
        *,
        products (
          *,
          supplier_products (
            supplier_id,
            unit_price,
            moq,
            suppliers (
              supplier_name,
              lead_time
            )
          )
        )
      `
      )
      .eq('organization_id', orgId)
      .lte('current_stock', 99999) // TODO: Fix raw SQL comparison
      .limit(params.limit || 20)
      .order('status', { ascending: true }); // 품절/위험 우선

    if (error) {
      return { error: `데이터베이스 오류: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        count: 0,
        message: '현재 발주가 필요한 품목이 없습니다.',
      };
    }

    // 결과 포맷팅
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = data.map((item: any) => {
      const productData = Array.isArray(item.products) ? item.products[0] : item.products;
      const supplierProductData = Array.isArray(productData?.supplier_products)
        ? productData.supplier_products[0]
        : productData?.supplier_products;
      const supplierData = Array.isArray(supplierProductData?.suppliers)
        ? supplierProductData.suppliers[0]
        : supplierProductData?.suppliers;

      // 추천 발주량 계산: 목표재고(안전재고 * 2) - 현재재고
      const targetStock = (item.safety_stock || 0) * 2;
      const recommendedQty = Math.max(
        0,
        Math.ceil(targetStock - (item.current_stock || 0))
      );

      // MOQ 적용
      const moq = supplierProductData?.moq || 1;
      const adjustedQty = Math.ceil(recommendedQty / moq) * moq;

      return {
        productCode: item.product_code,
        productName: productData?.product_name || '알 수 없음',
        currentStock: item.current_stock,
        unit: productData?.unit || 'EA',
        status: item.status,
        safetyStock: item.safety_stock,
        reorderPoint: item.reorder_point,
        recommendedQty: adjustedQty,
        supplierName: supplierData?.supplier_name || '공급자 없음',
        unitPrice: supplierProductData?.unit_price || 0,
        estimatedCost: adjustedQty * (supplierProductData?.unit_price || 0),
        leadTime: supplierData?.lead_time || productData?.lead_time || 0,
        abcGrade: productData?.abc_grade || 'N/A',
        urgency:
          item.status === '품절' || item.status === '위험'
            ? '긴급'
            : item.status === '부족'
              ? '우선'
              : '보통',
      };
    });

    // 긴급도 순으로 정렬
    const urgencyOrder = { 긴급: 0, 우선: 1, 보통: 2 };
    result.sort(
      (a, b) =>
        urgencyOrder[a.urgency as keyof typeof urgencyOrder] -
        urgencyOrder[b.urgency as keyof typeof urgencyOrder]
    );

    return {
      success: true,
      data: result,
      count: result.length,
      totalEstimatedCost: result.reduce((sum, r) => sum + r.estimatedCost, 0),
    };
  } catch (error) {
    console.error('getReorderRecommendations error:', error);
    return { error: '발주 추천 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 발주 이력 조회
 */
export async function getPurchaseOrderHistory(params: {
  status?: string;
  limit?: number;
  startDate?: string;
}) {
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
      .from('purchase_orders')
      .select(
        `
        *,
        suppliers (supplier_name),
        purchase_order_items (
          *,
          products (product_name, unit)
        )
      `
      )
      .eq('organization_id', orgId);

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.startDate) {
      query = query.gte('order_date', params.startDate);
    }

    query = query.limit(params.limit || 10).order('order_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { error: `데이터베이스 오류: ${error.message}` };
    }

    const result = data.map((po) => ({
      orderId: po.id,
      orderNumber: po.order_number,
      supplierName: po.suppliers?.supplier_name || '알 수 없음',
      orderDate: po.order_date,
      expectedDate: po.expected_delivery_date,
      status: po.status,
      totalAmount: po.total_amount,
      itemCount: po.purchase_order_items?.length || 0,
      items: po.purchase_order_items?.map((item: unknown) => {
        const itemData = item as Record<string, unknown>;
        const productData = itemData.products as Record<string, unknown> | undefined;
        const qty = itemData.quantity as number || 0;
        const price = itemData.unit_price as number || 0;
        return {
          productName: (productData?.product_name as string) || '알 수 없음',
          quantity: qty,
          unit: (productData?.unit as string) || 'EA',
          unitPrice: price,
          subtotal: qty * price,
        };
      }),
    }));

    return {
      success: true,
      data: result,
      count: result.length,
    };
  } catch (error) {
    console.error('getPurchaseOrderHistory error:', error);
    return { error: '발주 이력 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * 특정 제품의 발주 추천
 */
export async function getProductReorderAdvice(params: { productCode: string }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.user_metadata?.organizationId) {
      return { error: '인증된 사용자가 아닙니다.' };
    }

    const orgId = user.user_metadata.organizationId;

    // 재고 정보 조회
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select(
        `
        *,
        products (
          *,
          supplier_products (
            supplier_id,
            unit_price,
            moq,
            suppliers (
              supplier_name,
              lead_time
            )
          )
        )
      `
      )
      .eq('organization_id', orgId)
      .eq('product_code', params.productCode)
      .single();

    if (invError || !inventory) {
      return { error: '해당 제품의 재고 정보를 찾을 수 없습니다.' };
    }

    const product = inventory.products;
    const supplierProduct = product?.supplier_products?.[0];
    const supplier = supplierProduct?.suppliers;

    // 발주 필요 여부 판단
    const needsReorder = (inventory.current_stock || 0) <= (inventory.reorder_point || 0);

    // 추천 발주량
    const targetStock = (inventory.safety_stock || 0) * 2;
    const recommendedQty = Math.max(
      0,
      Math.ceil(targetStock - (inventory.current_stock || 0))
    );
    const moq = supplierProduct?.moq || 1;
    const adjustedQty = Math.ceil(recommendedQty / moq) * moq;

    // 최근 30일 판매량
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sales } = await supabase
      .from('sales_records')
      .select('quantity')
      .eq('organization_id', orgId)
      .eq('product_code', params.productCode)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const totalSales = sales?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
    const avgDailySales = totalSales / 30;

    // 재고일수
    const daysOfInventory =
      avgDailySales > 0 ? (inventory.current_stock || 0) / avgDailySales : 999;

    return {
      success: true,
      data: {
        productCode: inventory.product_code,
        productName: product?.product_name || '알 수 없음',
        currentStock: inventory.current_stock,
        unit: product?.unit || 'EA',
        status: inventory.status,
        safetyStock: inventory.safety_stock,
        reorderPoint: inventory.reorder_point,
        needsReorder,
        recommendedQty: needsReorder ? adjustedQty : 0,
        supplierName: supplier?.supplier_name || '공급자 없음',
        unitPrice: supplierProduct?.unit_price || 0,
        estimatedCost: adjustedQty * (supplierProduct?.unit_price || 0),
        leadTime: supplier?.lead_time || product?.lead_time || 0,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        daysOfInventory: Math.round(daysOfInventory * 10) / 10,
        abcGrade: product?.abc_grade || 'N/A',
        xyzGrade: product?.xyz_grade || 'N/A',
        advice: needsReorder
          ? inventory.status === '품절' || inventory.status === '위험'
            ? '긴급 발주가 필요합니다. 즉시 발주를 진행하세요.'
            : inventory.status === '부족'
              ? '우선 발주가 권장됩니다. 1~2일 내에 발주하세요.'
              : '발주점에 도달했습니다. 정기 발주일에 발주하세요.'
          : '현재 재고가 충분합니다. 발주가 필요하지 않습니다.',
      },
    };
  } catch (error) {
    console.error('getProductReorderAdvice error:', error);
    return { error: '제품 발주 추천 조회 중 오류가 발생했습니다.' };
  }
}
