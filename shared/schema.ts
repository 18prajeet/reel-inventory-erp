import { pgTable, text, serial, integer, timestamp, unique, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Auto-generated: Size-GSM-Shade
  size: integer("size").notNull(), // Width in mm/inches? Assuming generic unit
  gsm: integer("gsm").notNull(),
  shade: text("shade").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqueReelType: unique().on(t.size, t.gsm, t.shade),
}));

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").notNull().references(() => reels.id),
  type: text("type", { enum: ["inward", "usage", "opening"] }).notNull(),
  quantity: doublePrecision("quantity").notNull(), // In KG
  date: timestamp("date").defaultNow(),
  notes: text("notes"),
});

export const reelsRelations = relations(reels, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  reel: one(reels, {
    fields: [transactions.reelId],
    references: [reels.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReelSchema = createInsertSchema(reels).omit({
  id: true,
  code: true, // Generated backend side
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  date: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Reel = typeof reels.$inferSelect;
export type InsertReel = z.infer<typeof insertReelSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// API Types
export type ReelWithStock = Reel & {
  currentStock: number;
};
