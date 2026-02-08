import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { subscriptions } from "./subscriptions";

/**
 * 결제 내역
 */
export const paymentHistory = pgTable("payment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
  amount: integer("amount").notNull(), // 결제 금액 (원)
  method: text("method").notNull(), // card, tosspay, kakaopay, naverpay
  status: text("status").notNull(), // success, failed, pending, refunded
  transactionId: text("transaction_id"), // 외부 결제 시스템 트랜잭션 ID
  errorMessage: text("error_message"), // 실패 시 오류 메시지
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type NewPaymentHistory = typeof paymentHistory.$inferInsert;
