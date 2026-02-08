/**
 * 제품 목업 데이터
 * TODO: Phase 2 완료 후 실제 DB 데이터로 교체
 */

import { INVENTORY_STATUS, getInventoryStatus } from "@/lib/constants/inventory-status";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  supplierId: string;
  supplierName: string;
  abcGrade: "A" | "B" | "C";
  xyzGrade: "X" | "Y" | "Z";
  createdAt: string;
  updatedAt: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "SKU-001",
    name: "스테인리스 볼트 M10",
    category: "체결류",
    unit: "EA",
    unitPrice: 150,
    currentStock: 0,
    safetyStock: 500,
    reorderPoint: 750,
    leadTimeDays: 7,
    supplierId: "s1",
    supplierName: "한국볼트",
    abcGrade: "A",
    xyzGrade: "X",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-01",
  },
  {
    id: "2",
    sku: "SKU-002",
    name: "육각너트 M10",
    category: "체결류",
    unit: "EA",
    unitPrice: 80,
    currentStock: 180,
    safetyStock: 400,
    reorderPoint: 600,
    leadTimeDays: 7,
    supplierId: "s1",
    supplierName: "한국볼트",
    abcGrade: "A",
    xyzGrade: "X",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-01",
  },
  {
    id: "3",
    sku: "SKU-003",
    name: "평와셔 M10",
    category: "체결류",
    unit: "EA",
    unitPrice: 30,
    currentStock: 350,
    safetyStock: 300,
    reorderPoint: 450,
    leadTimeDays: 5,
    supplierId: "s1",
    supplierName: "한국볼트",
    abcGrade: "B",
    xyzGrade: "X",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-01",
  },
  {
    id: "4",
    sku: "SKU-004",
    name: "알루미늄 프로파일 4040",
    category: "프레임",
    unit: "M",
    unitPrice: 12000,
    currentStock: 85,
    safetyStock: 100,
    reorderPoint: 150,
    leadTimeDays: 14,
    supplierId: "s2",
    supplierName: "대한알루미늄",
    abcGrade: "A",
    xyzGrade: "Y",
    createdAt: "2024-01-20",
    updatedAt: "2024-02-05",
  },
  {
    id: "5",
    sku: "SKU-005",
    name: "베어링 6205",
    category: "동력전달",
    unit: "EA",
    unitPrice: 8500,
    currentStock: 450,
    safetyStock: 100,
    reorderPoint: 150,
    leadTimeDays: 10,
    supplierId: "s3",
    supplierName: "NSK코리아",
    abcGrade: "A",
    xyzGrade: "X",
    createdAt: "2024-01-10",
    updatedAt: "2024-02-01",
  },
  {
    id: "6",
    sku: "SKU-006",
    name: "유압실린더 50-100",
    category: "유압",
    unit: "EA",
    unitPrice: 185000,
    currentStock: 12,
    safetyStock: 10,
    reorderPoint: 15,
    leadTimeDays: 21,
    supplierId: "s4",
    supplierName: "SMC코리아",
    abcGrade: "A",
    xyzGrade: "Z",
    createdAt: "2024-01-25",
    updatedAt: "2024-02-10",
  },
  {
    id: "7",
    sku: "SKU-007",
    name: "PLC CPU모듈",
    category: "전기",
    unit: "EA",
    unitPrice: 850000,
    currentStock: 3,
    safetyStock: 2,
    reorderPoint: 3,
    leadTimeDays: 30,
    supplierId: "s5",
    supplierName: "미쓰비시전기",
    abcGrade: "A",
    xyzGrade: "Z",
    createdAt: "2024-01-05",
    updatedAt: "2024-02-01",
  },
  {
    id: "8",
    sku: "SKU-008",
    name: "케이블 VCTF 2.5sq",
    category: "전기",
    unit: "M",
    unitPrice: 2500,
    currentStock: 1800,
    safetyStock: 500,
    reorderPoint: 750,
    leadTimeDays: 3,
    supplierId: "s6",
    supplierName: "대한전선",
    abcGrade: "B",
    xyzGrade: "X",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-01",
  },
  {
    id: "9",
    sku: "SKU-009",
    name: "윤활유 ISO VG32",
    category: "소모품",
    unit: "L",
    unitPrice: 15000,
    currentStock: 200,
    safetyStock: 50,
    reorderPoint: 80,
    leadTimeDays: 5,
    supplierId: "s7",
    supplierName: "SK루브리컨츠",
    abcGrade: "C",
    xyzGrade: "Y",
    createdAt: "2024-01-20",
    updatedAt: "2024-02-01",
  },
  {
    id: "10",
    sku: "SKU-010",
    name: "안전장갑 L",
    category: "소모품",
    unit: "켤레",
    unitPrice: 3500,
    currentStock: 45,
    safetyStock: 100,
    reorderPoint: 150,
    leadTimeDays: 3,
    supplierId: "s8",
    supplierName: "한국안전용품",
    abcGrade: "C",
    xyzGrade: "X",
    createdAt: "2024-01-10",
    updatedAt: "2024-02-01",
  },
];

/**
 * 제품에 재고상태 추가
 */
export function getProductsWithStatus() {
  return MOCK_PRODUCTS.map((product) => ({
    ...product,
    status: getInventoryStatus(product.currentStock, product.safetyStock, product.reorderPoint),
  }));
}

/**
 * 대시보드 통계
 */
export function getDashboardStats() {
  const products = getProductsWithStatus();

  const totalSku = products.length;
  const outOfStock = products.filter((p) => p.status.key === "out_of_stock").length;
  const critical = products.filter((p) => p.status.key === "critical").length;
  const needsOrder = products.filter((p) =>
    ["out_of_stock", "critical", "shortage"].includes(p.status.key)
  ).length;
  const excess = products.filter((p) => ["excess", "overstock"].includes(p.status.key)).length;

  return {
    totalSku,
    outOfStock,
    critical,
    needsOrder,
    excess,
  };
}

/**
 * 재고상태별 분포
 */
export function getStatusDistribution() {
  const products = getProductsWithStatus();
  const distribution: Record<string, number> = {};

  products.forEach((p) => {
    const key = p.status.key;
    distribution[key] = (distribution[key] || 0) + 1;
  });

  return Object.entries(distribution).map(([key, count]) => {
    const statusInfo = Object.values(INVENTORY_STATUS).find((s) => s.key === key);
    return {
      key,
      label: statusInfo?.label || key,
      count,
      color: statusInfo?.color || "gray",
    };
  });
}
