/**
 * 제품 시드 데이터
 *
 * 다양한 ABC/XYZ 등급을 가진 현실적인 제품 데이터
 */

import { db } from "../index";
import { products, type Product, type Supplier } from "../schema";

interface ProductSeedData {
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  abcGrade: "A" | "B" | "C";
  xyzGrade: "X" | "Y" | "Z";
  moq: number;
  leadTime: number;
  safetyStock: number;
  reorderPoint: number;
  supplierIndex: number; // 공급자 배열 인덱스
}

const PRODUCT_DATA: ProductSeedData[] = [
  // === A등급 (매출 상위 80%) ===
  // A-X: 고가치 + 안정적 수요
  {
    sku: "SKU-A001",
    name: "스마트폰 케이스 (갤럭시S24)",
    category: "액세서리",
    unit: "EA",
    unitPrice: 25000,
    costPrice: 12000,
    abcGrade: "A",
    xyzGrade: "X",
    moq: 100,
    leadTime: 5,
    safetyStock: 200,
    reorderPoint: 350,
    supplierIndex: 0,
  },
  {
    sku: "SKU-A002",
    name: "USB-C 케이블 1m",
    category: "케이블",
    unit: "EA",
    unitPrice: 8000,
    costPrice: 2500,
    abcGrade: "A",
    xyzGrade: "X",
    moq: 500,
    leadTime: 3,
    safetyStock: 1000,
    reorderPoint: 1500,
    supplierIndex: 2,
  },
  {
    sku: "SKU-A003",
    name: "무선 이어버드 (에어팟 호환)",
    category: "오디오",
    unit: "EA",
    unitPrice: 45000,
    costPrice: 22000,
    abcGrade: "A",
    xyzGrade: "X",
    moq: 50,
    leadTime: 7,
    safetyStock: 100,
    reorderPoint: 180,
    supplierIndex: 0,
  },
  // A-Y: 고가치 + 변동 수요
  {
    sku: "SKU-A004",
    name: "노트북 파우치 15인치",
    category: "액세서리",
    unit: "EA",
    unitPrice: 35000,
    costPrice: 15000,
    abcGrade: "A",
    xyzGrade: "Y",
    moq: 30,
    leadTime: 7,
    safetyStock: 80,
    reorderPoint: 140,
    supplierIndex: 1,
  },
  {
    sku: "SKU-A005",
    name: "고속충전기 65W",
    category: "충전기",
    unit: "EA",
    unitPrice: 32000,
    costPrice: 14000,
    abcGrade: "A",
    xyzGrade: "Y",
    moq: 100,
    leadTime: 5,
    safetyStock: 150,
    reorderPoint: 250,
    supplierIndex: 0,
  },
  // A-Z: 고가치 + 불규칙 수요 (신제품/시즌)
  {
    sku: "SKU-A006",
    name: "크리스마스 특별 기프트세트",
    category: "기프트",
    unit: "SET",
    unitPrice: 89000,
    costPrice: 45000,
    abcGrade: "A",
    xyzGrade: "Z",
    moq: 20,
    leadTime: 14,
    safetyStock: 50,
    reorderPoint: 100,
    supplierIndex: 1,
  },

  // === B등급 (매출 중위 15%) ===
  // B-X: 중간가치 + 안정적
  {
    sku: "SKU-B001",
    name: "마우스패드 XL",
    category: "액세서리",
    unit: "EA",
    unitPrice: 15000,
    costPrice: 5000,
    abcGrade: "B",
    xyzGrade: "X",
    moq: 50,
    leadTime: 3,
    safetyStock: 100,
    reorderPoint: 150,
    supplierIndex: 4,
  },
  {
    sku: "SKU-B002",
    name: "HDMI 케이블 2m",
    category: "케이블",
    unit: "EA",
    unitPrice: 12000,
    costPrice: 4000,
    abcGrade: "B",
    xyzGrade: "X",
    moq: 100,
    leadTime: 3,
    safetyStock: 200,
    reorderPoint: 300,
    supplierIndex: 2,
  },
  // B-Y: 중간가치 + 변동
  {
    sku: "SKU-B003",
    name: "블루투스 스피커 미니",
    category: "오디오",
    unit: "EA",
    unitPrice: 28000,
    costPrice: 12000,
    abcGrade: "B",
    xyzGrade: "Y",
    moq: 30,
    leadTime: 7,
    safetyStock: 60,
    reorderPoint: 100,
    supplierIndex: 0,
  },
  {
    sku: "SKU-B004",
    name: "태블릿 거치대",
    category: "액세서리",
    unit: "EA",
    unitPrice: 18000,
    costPrice: 7000,
    abcGrade: "B",
    xyzGrade: "Y",
    moq: 50,
    leadTime: 5,
    safetyStock: 80,
    reorderPoint: 130,
    supplierIndex: 1,
  },
  // B-Z: 중간가치 + 불규칙
  {
    sku: "SKU-B005",
    name: "웹캠 1080p",
    category: "영상장비",
    unit: "EA",
    unitPrice: 55000,
    costPrice: 28000,
    abcGrade: "B",
    xyzGrade: "Z",
    moq: 20,
    leadTime: 10,
    safetyStock: 30,
    reorderPoint: 60,
    supplierIndex: 3,
  },

  // === C등급 (매출 하위 5%) ===
  // C-X: 저가치 + 안정적 (소모품)
  {
    sku: "SKU-C001",
    name: "케이블타이 100개입",
    category: "소모품",
    unit: "PACK",
    unitPrice: 3000,
    costPrice: 800,
    abcGrade: "C",
    xyzGrade: "X",
    moq: 100,
    leadTime: 2,
    safetyStock: 200,
    reorderPoint: 300,
    supplierIndex: 4,
  },
  {
    sku: "SKU-C002",
    name: "화면 클리너 세트",
    category: "소모품",
    unit: "SET",
    unitPrice: 5000,
    costPrice: 1500,
    abcGrade: "C",
    xyzGrade: "X",
    moq: 50,
    leadTime: 2,
    safetyStock: 100,
    reorderPoint: 150,
    supplierIndex: 4,
  },
  // C-Y: 저가치 + 변동
  {
    sku: "SKU-C003",
    name: "스마트폰 거치대 (차량용)",
    category: "액세서리",
    unit: "EA",
    unitPrice: 12000,
    costPrice: 4500,
    abcGrade: "C",
    xyzGrade: "Y",
    moq: 30,
    leadTime: 5,
    safetyStock: 50,
    reorderPoint: 80,
    supplierIndex: 1,
  },
  // C-Z: 저가치 + 불규칙 (단종 예정)
  {
    sku: "SKU-C004",
    name: "미니 USB 케이블 (레거시)",
    category: "케이블",
    unit: "EA",
    unitPrice: 4000,
    costPrice: 1000,
    abcGrade: "C",
    xyzGrade: "Z",
    moq: 100,
    leadTime: 7,
    safetyStock: 50,
    reorderPoint: 100,
    supplierIndex: 2,
  },
  {
    sku: "SKU-C005",
    name: "CD/DVD 보관함",
    category: "액세서리",
    unit: "EA",
    unitPrice: 8000,
    costPrice: 2500,
    abcGrade: "C",
    xyzGrade: "Z",
    moq: 20,
    leadTime: 10,
    safetyStock: 20,
    reorderPoint: 40,
    supplierIndex: 3,
  },
];

export async function seedProducts(
  organizationId: string,
  supplierList: Supplier[]
): Promise<Product[]> {
  const productList: Product[] = [];

  for (const data of PRODUCT_DATA) {
    const supplier = supplierList[data.supplierIndex];

    const [product] = await db
      .insert(products)
      .values({
        organizationId,
        sku: data.sku,
        name: data.name,
        category: data.category,
        unit: data.unit,
        unitPrice: data.unitPrice,
        costPrice: data.costPrice,
        abcGrade: data.abcGrade,
        xyzGrade: data.xyzGrade,
        moq: data.moq,
        leadTime: data.leadTime,
        safetyStock: data.safetyStock,
        reorderPoint: data.reorderPoint,
        primarySupplierId: supplier?.id,
        isActive: new Date(),
      })
      .returning();

    productList.push(product);
    console.log(`  ✓ 제품: ${product.sku} - ${product.name} (${data.abcGrade}${data.xyzGrade})`);
  }

  return productList;
}
