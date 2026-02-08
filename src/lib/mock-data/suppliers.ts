/**
 * 공급자 목업 데이터
 */

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  rating: number; // 1-5
  productCount: number;
  totalOrders: number;
  createdAt: string;
}

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "한국볼트",
    contactName: "김철수",
    email: "sales@koreabolt.co.kr",
    phone: "02-1234-5678",
    address: "경기도 안산시 단원구 산업로 123",
    leadTimeDays: 7,
    rating: 4.5,
    productCount: 3,
    totalOrders: 156,
    createdAt: "2023-06-15",
  },
  {
    id: "s2",
    name: "대한알루미늄",
    contactName: "이영희",
    email: "order@daehan-alu.com",
    phone: "031-987-6543",
    address: "경기도 시흥시 공단로 456",
    leadTimeDays: 14,
    rating: 4.2,
    productCount: 1,
    totalOrders: 48,
    createdAt: "2023-08-20",
  },
  {
    id: "s3",
    name: "NSK코리아",
    contactName: "박민수",
    email: "support@nsk-korea.co.kr",
    phone: "02-555-1234",
    address: "서울시 강남구 테헤란로 789",
    leadTimeDays: 10,
    rating: 4.8,
    productCount: 1,
    totalOrders: 89,
    createdAt: "2023-05-10",
  },
  {
    id: "s4",
    name: "SMC코리아",
    contactName: "최지훈",
    email: "sales@smc-korea.com",
    phone: "032-456-7890",
    address: "인천시 남동구 산업단지로 321",
    leadTimeDays: 21,
    rating: 4.6,
    productCount: 1,
    totalOrders: 34,
    createdAt: "2023-07-01",
  },
  {
    id: "s5",
    name: "미쓰비시전기",
    contactName: "정하나",
    email: "order@mitsubishi-elec.kr",
    phone: "02-777-8888",
    address: "서울시 서초구 반포대로 654",
    leadTimeDays: 30,
    rating: 4.9,
    productCount: 1,
    totalOrders: 22,
    createdAt: "2023-04-15",
  },
  {
    id: "s6",
    name: "대한전선",
    contactName: "강민호",
    email: "cable@daehan-cable.co.kr",
    phone: "031-222-3333",
    address: "경기도 평택시 산업로 987",
    leadTimeDays: 3,
    rating: 4.3,
    productCount: 1,
    totalOrders: 112,
    createdAt: "2023-03-20",
  },
  {
    id: "s7",
    name: "SK루브리컨츠",
    contactName: "윤서연",
    email: "lube@sk-lub.com",
    phone: "02-333-4444",
    address: "서울시 종로구 새문안로 123",
    leadTimeDays: 5,
    rating: 4.4,
    productCount: 1,
    totalOrders: 67,
    createdAt: "2023-09-01",
  },
  {
    id: "s8",
    name: "한국안전용품",
    contactName: "임재현",
    email: "safety@ksafety.kr",
    phone: "031-444-5555",
    address: "경기도 화성시 동탄로 456",
    leadTimeDays: 3,
    rating: 4.1,
    productCount: 1,
    totalOrders: 78,
    createdAt: "2023-10-15",
  },
];
