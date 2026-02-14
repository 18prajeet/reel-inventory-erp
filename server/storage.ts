import { db } from "./db";
import {
  reels,
  transactions,
  users,
  type Reel,
  type InsertReel,
  type Transaction,
  type InsertTransaction,
  type User,
  type InsertUser,
  type ReelWithStock,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

    /* -------------------- Password Reset -------------------- */

  getUserByEmail(email: string): Promise<User | undefined>;

  setPasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<void>;

  resetPasswordWithToken(
    token: string,
    newHashedPassword: string
  ): Promise<User | undefined>;


  getReels(): Promise<ReelWithStock[]>;
  getReel(
    id: number
  ): Promise<(ReelWithStock & { transactions: Transaction[] }) | undefined>;
  createReel(reel: InsertReel): Promise<Reel>;
  updateReel(
    id: number,
    reel: {
      size: number;
      gsm: number;
      shade: string;
      bf?: number;
      supplier?: string;
      weightKg:number
    }
  ): Promise<Reel>;
  deleteReel(id: number): Promise<void>;

  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(
    id: number,
    transaction: Partial<InsertTransaction>
  ): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  /* -------------------- Users -------------------- */

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
    async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

    async setPasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpires: expiresAt,
      })
      .where(eq(users.id, userId));
  }



    async resetPasswordWithToken(
    token: string,
    newHashedPassword: string
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));

    if (!user) return undefined;

    // ⏰ token expired
    if (
      user.resetTokenExpires &&
      user.resetTokenExpires < new Date()
    ) {
      return undefined;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        password: newHashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }




 private async recalculateStock(reelId: number) {
  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.reelId, reelId))
    .orderBy(transactions.date); // oldest → newest

  const [reel] = await db
    .select()
    .from(reels)
    .where(eq(reels.id, reelId));

  if (!reel) throw new Error("Reel not found");

  let stock = 0;
  let bitReelKg = 0;

  const resetTime = reel.bitReelClearedAt;

  for (const tx of txs) {
    // 🚫 IGNORE OLD TRANSACTIONS
    if (resetTime && tx.date && tx.date <= resetTime) {
      continue;
    }

    if (tx.type === "opening" || tx.type === "inward") {
      stock += tx.quantity;
    }

   if (tx.type === "usage") {
    const remaining = stock - tx.quantity;

  if (remaining > 0) {
    bitReelKg += remaining;
  }

  stock = 0; // daily clearing rule
}

  }

  await db
    .update(reels)
    .set({ bitReelKg })
    .where(eq(reels.id, reelId));

  return stock;
}



// async clearBitReel(reelId: number): Promise<void> {
//   await db
//     .update(reels)
//     .set({ bitReelKg: 0, bitReelClearedAt: new Date(),})
//     .where(eq(reels.id, reelId));
// }

  /* -------------------- Reels -------------------- */

  async getReels(): Promise<ReelWithStock[]> {
    const allReels = await db.select().from(reels);

    return Promise.all(
      allReels.map(async (reel) => {
        const stock = await this.recalculateStock(reel.id);
        return {
          ...reel,
          currentStock: stock,
        };
      })
    );
  }

  async getReel(
    id: number
  ): Promise<(ReelWithStock & { transactions: Transaction[] }) | undefined> {
    const [reel] = await db.select().from(reels).where(eq(reels.id, id));
    if (!reel) return undefined;

    const txs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reelId, id))
      .orderBy(desc(transactions.date));

    const stock = await this.recalculateStock(id);

    return {
      ...reel,
      currentStock: stock,
      transactions: txs,
    };
  }

 async createReel(insertReel: InsertReel): Promise<Reel> {
  // ❌ REMOVED: reelSpecExists check
  // ❌ REMOVED: manual duplicate validation
  // ✅ ONLY reelId uniqueness is enforced by DB
  const code = `${insertReel.size}-${insertReel.gsm}-${insertReel.shade.toUpperCase()}`;
  const [reel] = await db
    .insert(reels)
    .values({
      ...insertReel,
      code,
      bitReelKg: 0,
    })
    .returning();

  return reel;
}

 async updateReel(
  id: number,
  updates: {
    size: number;
    gsm: number;
    shade: string;
    weightKg: number;      // ✅ ADD THIS
    bf?: number;
    supplier?: string;
  }
): Promise<Reel> {
  const newCode = `${updates.size}-${updates.gsm}-${updates.shade.toUpperCase()}`;

  const [reel] = await db
    .update(reels)
    .set({
      size: updates.size,
      gsm: updates.gsm,
      shade: updates.shade,
      weightKg: updates.weightKg, // ✅ THIS WAS NEVER SAVED BEFORE
      bf: updates.bf,
      supplier: updates.supplier,
      code: newCode,
    })
    .where(eq(reels.id, id))
    .returning();

  return reel;
}


  async deleteReel(id: number): Promise<void> {
    const txs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reelId, id));

    if (txs.length > 0) {
      throw new Error("Cannot delete reel with existing transactions.");
    }

    await db.delete(reels).where(eq(reels.id, id));
  }

  async updateBitReel(reelId: number, bitReelKg: number) {
  await db
    .update(reels)
    .set({
      bitReelKg,
    })
    .where(eq(reels.id, reelId));
}



  /* -------------------- Transactions -------------------- */

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return tx;
  }

  async createTransaction(
    transaction: InsertTransaction
  ): Promise<Transaction> {
    const reel = await this.getReel(transaction.reelId);
    if (!reel) {
      throw new Error("Reel not found");
    }

    if (transaction.type === "usage") {
  const stock = await this.recalculateStock(transaction.reelId);
  if (transaction.quantity > stock) {
    throw new Error("Insufficient stock available");
  }
}

    const [tx] = await db
      .insert(transactions)
      .values(transaction)
      .returning();

    await this.recalculateStock(transaction.reelId);
    return tx;
  }

  async updateTransaction(
    id: number,
    updates: Partial<InsertTransaction>
  ): Promise<Transaction> {
    const [tx] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();

    await this.recalculateStock(tx.reelId);
    return tx;
  }

  async deleteTransaction(id: number): Promise<void> {
    const tx = await this.getTransaction(id);
    if (!tx) return;

    await db.delete(transactions).where(eq(transactions.id, id));
    await this.recalculateStock(tx.reelId);
  }
}

export const storage = new DatabaseStorage();
