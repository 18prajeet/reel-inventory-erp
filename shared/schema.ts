import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  doublePrecision,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

/* -------------------- Users -------------------- */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
});

/* -------------------- Reels -------------------- */

export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),

  // Manual Reel Identifier (AA001, AA002...)
  reelId: text("reel_id").notNull().unique(),

  // Auto-generated code: Size-GSM-Shade
  code: text("code").notNull(),

  // Specifications
  size: integer("size").notNull(), // CM
  gsm: integer("gsm").notNull(),
  shade: text("shade").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),

  

  bf: integer("bf"),
  supplier: text("supplier"),

  // ✅ ERP-CORRECT: accumulated bit reel
  bitReelKg: doublePrecision("bit_reel_kg").default(0),
  bitReelManual: boolean("bit_reel_manual").default(false),
  bitReelClearedAt: timestamp("bit_reel_cleared_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* -------------------- Transactions -------------------- */

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),

  reelId: integer("reel_id")
    .notNull()
    .references(() => reels.id),

  type: text("type", {
    enum: ["opening", "inward", "usage"],
  }).notNull(),

  quantity: doublePrecision("quantity").notNull(), // KG only

  date: timestamp("date").defaultNow(),
  notes: text("notes"),
});

/* -------------------- Relations -------------------- */

export const reelsRelations = relations(reels, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  reel: one(reels, {
    fields: [transactions.reelId],
    references: [reels.id],
  }),
}));

/* -------------------- Zod Schemas -------------------- */

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReelSchema = createInsertSchema(reels)
  .omit({
    id: true,
    code: true,
    createdAt: true,
  })
  .extend({
    reelId: z
      .string()
      .min(1, "Reel ID is required")
      .regex(/^[A-Za-z0-9_-]+$/, "Invalid Reel ID format"),

       weightKg: z
      .number()
      .positive("Weight must be greater than 0"),
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({
    id: true,
    date: true,
  })
  .extend({
    quantity: z
      .number()
      .positive("Quantity must be greater than zero"),
  });

/* -------------------- Types -------------------- */

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Reel = typeof reels.$inferSelect;
export type InsertReel = z.infer<typeof insertReelSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type ReelWithStock = Reel & {
  currentStock: number;
};
