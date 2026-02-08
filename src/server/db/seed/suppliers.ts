/**
 * 공급자 시드 데이터
 */

import { db } from "../index";
import { suppliers, type Supplier } from "../schema";

const SUPPLIER_DATA = [
  {
    name: "한국전자부품(주)",
    code: "SUP-001",
    businessNumber: "123-45-67890",
    contactName: "김부품",
    contactEmail: "kim@hkelec.co.kr",
    contactPhone: "02-1234-5678",
    address: "서울시 금천구 가산디지털1로 123",
    paymentTerms: "월말마감 익월말",
    minOrderAmount: 500000,
    avgLeadTime: 5,
    minLeadTime: 3,
    maxLeadTime: 7,
    rating: "92",
  },
  {
    name: "글로벌유통",
    code: "SUP-002",
    businessNumber: "234-56-78901",
    contactName: "이유통",
    contactEmail: "lee@global.co.kr",
    contactPhone: "02-2345-6789",
    address: "서울시 강남구 테헤란로 456",
    paymentTerms: "월말마감 30일",
    minOrderAmount: 1000000,
    avgLeadTime: 7,
    minLeadTime: 5,
    maxLeadTime: 10,
    rating: "88",
  },
  {
    name: "대한물류센터",
    code: "SUP-003",
    businessNumber: "345-67-89012",
    contactName: "박물류",
    contactEmail: "park@dhlogis.co.kr",
    contactPhone: "031-456-7890",
    address: "경기도 용인시 처인구 물류로 789",
    paymentTerms: "현금결제",
    minOrderAmount: 300000,
    avgLeadTime: 3,
    minLeadTime: 2,
    maxLeadTime: 5,
    rating: "95",
  },
  {
    name: "아시아부품수출입",
    code: "SUP-004",
    businessNumber: "456-78-90123",
    contactName: "최아시아",
    contactEmail: "choi@asiparts.com",
    contactPhone: "032-567-8901",
    address: "인천시 중구 자유무역로 101",
    paymentTerms: "선금 30% + 잔금 70%",
    minOrderAmount: 2000000,
    avgLeadTime: 14,
    minLeadTime: 10,
    maxLeadTime: 21,
    rating: "78",
  },
  {
    name: "국내소모품(주)",
    code: "SUP-005",
    businessNumber: "567-89-01234",
    contactName: "정소모",
    contactEmail: "jung@knparts.co.kr",
    contactPhone: "02-678-9012",
    address: "서울시 성동구 성수이로 222",
    paymentTerms: "월말마감 익월 15일",
    minOrderAmount: 100000,
    avgLeadTime: 2,
    minLeadTime: 1,
    maxLeadTime: 3,
    rating: "90",
  },
];

export async function seedSuppliers(organizationId: string): Promise<Supplier[]> {
  const supplierList: Supplier[] = [];

  for (const data of SUPPLIER_DATA) {
    const [supplier] = await db
      .insert(suppliers)
      .values({
        organizationId,
        ...data,
        isActive: new Date(),
      })
      .returning();

    supplierList.push(supplier);
    console.log(`  ✓ 공급자: ${supplier.name}`);
  }

  return supplierList;
}
