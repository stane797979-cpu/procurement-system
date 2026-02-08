/**
 * 재고 수불부 계산 서비스
 *
 * Excel 내보내기와 UI 화면 표시에서 공유하는 순수 계산 함수.
 * inventory_history 레코드를 받아서 제품별 일별 수불부를 계산합니다.
 */

export interface MovementRecord {
  productId: string;
  productSku: string;
  productName: string;
  productUnit?: string;
  date: string;
  changeAmount: number;
  stockBefore: number;
  stockAfter: number;
  changeType?: string;
  costPrice?: number;
  notes?: string;
  referenceId?: string | null;
  referenceType?: string | null;
}

export interface DailyMovement {
  date: string;
  openingStock: number;
  inbound: number;
  outbound: number;
  closingStock: number;
}

export interface ProductMovementSummary {
  productId: string;
  productSku: string;
  productName: string;
  dailyMovements: DailyMovement[];
  /** 기간 내 첫 날 기초재고 */
  openingStock: number;
  /** 기간 내 마지막 날 기말재고 */
  closingStock: number;
  totalInbound: number;
  totalOutbound: number;
}

/**
 * 기간 내 날짜 목록 생성 (YYYY-MM-DD)
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * 제품별 일별 수불부 계산
 *
 * @param records - inventory_history 레코드 (날짜 ASC, createdAt ASC 정렬)
 * @param startDate - 시작일 (YYYY-MM-DD)
 * @param endDate - 종료일 (YYYY-MM-DD)
 * @returns 제품별 수불 요약 배열
 */
export function calculateDailyMovements(
  records: MovementRecord[],
  startDate: string,
  endDate: string
): ProductMovementSummary[] {
  // 1. 제품별로 그룹핑
  const byProduct = new Map<
    string,
    { sku: string; name: string; records: MovementRecord[] }
  >();

  for (const record of records) {
    if (!byProduct.has(record.productId)) {
      byProduct.set(record.productId, {
        sku: record.productSku,
        name: record.productName,
        records: [],
      });
    }
    byProduct.get(record.productId)!.records.push(record);
  }

  // 2. 기간 내 날짜 목록 생성
  const dates = generateDateRange(startDate, endDate);

  // 3. 제품별 일별 수불부 계산
  const summaries: ProductMovementSummary[] = [];

  for (const [productId, productData] of byProduct) {
    // 날짜별 변동 그룹핑
    const changesByDate = new Map<
      string,
      { inbound: number; outbound: number; lastStockAfter: number }
    >();

    for (const record of productData.records) {
      if (!changesByDate.has(record.date)) {
        changesByDate.set(record.date, {
          inbound: 0,
          outbound: 0,
          lastStockAfter: record.stockAfter,
        });
      }
      const entry = changesByDate.get(record.date)!;
      if (record.changeAmount > 0) {
        entry.inbound += record.changeAmount;
      } else {
        entry.outbound += Math.abs(record.changeAmount);
      }
      entry.lastStockAfter = record.stockAfter;
    }

    // 일별 수불부 생성
    const dailyMovements: DailyMovement[] = [];
    let totalInbound = 0;
    let totalOutbound = 0;

    // 첫 번째 기록의 stockBefore로 기초재고 설정
    const sortedRecords = [...productData.records].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    let currentOpeningStock =
      sortedRecords.length > 0 ? sortedRecords[0].stockBefore : 0;
    const periodOpeningStock = currentOpeningStock;

    for (const date of dates) {
      const changes = changesByDate.get(date);
      const inbound = changes?.inbound || 0;
      const outbound = changes?.outbound || 0;
      const closingStock = currentOpeningStock + inbound - outbound;

      dailyMovements.push({
        date,
        openingStock: currentOpeningStock,
        inbound,
        outbound,
        closingStock,
      });

      totalInbound += inbound;
      totalOutbound += outbound;
      currentOpeningStock = closingStock;
    }

    summaries.push({
      productId,
      productSku: productData.sku,
      productName: productData.name,
      dailyMovements,
      openingStock: periodOpeningStock,
      closingStock: currentOpeningStock,
      totalInbound,
      totalOutbound,
    });
  }

  // SKU 기준 정렬
  summaries.sort((a, b) => a.productSku.localeCompare(b.productSku));

  return summaries;
}
