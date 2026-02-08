import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { products } from "./products";
import { inboundRecords } from "./inbound-records";

// 재고 상태 (7단계)
export const inventoryStatusEnum = pgEnum("inventory_status", [
  "out_of_stock", // 품절 ⚫
  "critical", // 위험 🔴
  "shortage", // 부족 🟠
  "caution", // 주의 🟡
  "optimal", // 적정 🟢
  "excess", // 과다 🔵
  "overstock", // 과잉 🟣
]);

// 현재 재고 (제품당 1개 레코드)
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  currentStock: integer("current_stock").default(0).notNull(), // 현재고
  availableStock: integer("available_stock").default(0), // 가용재고 (현재고 - 예약)
  reservedStock: integer("reserved_stock").default(0), // 예약재고
  incomingStock: integer("incoming_stock").default(0), // 입고예정
  status: inventoryStatusEnum("status").default("optimal"),
  location: text("location"), // 창고 위치
  // 계산 필드 (캐싱)
  daysOfInventory: numeric("days_of_inventory", { precision: 8, scale: 2 }), // 재고일수
  inventoryValue: integer("inventory_value").default(0), // 재고금액 (원)
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 재고 이력 (변동 기록)
export const inventoryHistory = pgTable("inventory_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),
  changeAmount: integer("change_amount").notNull(), // 양수: 입고, 음수: 출고
  changeType: text("change_type").notNull(), // inbound, outbound, adjustment, sale
  referenceId: uuid("reference_id"), // 관련 문서 ID (발주서, 판매기록 등)
  referenceType: text("reference_type"), // purchase_order, sale, adjustment
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Lot 상태
export const lotStatusEnum = pgEnum("lot_status", [
  "active", // 사용 가능
  "depleted", // 소진
  "expired", // 만료
]);

// Lot별 재고 (입고 시 생성, 출고 시 FIFO 차감)
export const inventoryLots = pgTable("inventory_lots", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  lotNumber: text("lot_number").notNull(), // Lot 번호
  expiryDate: date("expiry_date"), // 유통기한 (선택)
  initialQuantity: integer("initial_quantity").notNull(), // 최초 입고 수량
  remainingQuantity: integer("remaining_quantity").notNull(), // 잔여 수량
  inboundRecordId: uuid("inbound_record_id").references(() => inboundRecords.id, {
    onDelete: "set null",
  }),
  receivedDate: date("received_date").notNull(), // 입고일
  status: lotStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
export type InventoryHistory = typeof inventoryHistory.$inferSelect;
export type NewInventoryHistory = typeof inventoryHistory.$inferInsert;
export type InventoryLot = typeof inventoryLots.$inferSelect;
export type NewInventoryLot = typeof inventoryLots.$inferInsert;
