import { db } from "./db";
import { 
  reels, transactions, users,
  type Reel, type InsertReel, 
  type Transaction, type InsertTransaction,
  type User, type InsertUser,
  type ReelWithStock
} from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Reels
  getReels(): Promise<ReelWithStock[]>;
  getReel(id: number): Promise<(ReelWithStock & { transactions: Transaction[] }) | undefined>;
  createReel(reel: InsertReel): Promise<Reel>;
  deleteReel(id: number): Promise<void>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getReels(): Promise<ReelWithStock[]> {
    // We need to calculate stock for each reel
    // Stock = (Opening + Inward) - Usage + Bit Reel
    const allReels = await db.select().from(reels);
    
    // In a real large-scale app, we might want to cache this or use a view
    const reelsWithStock = await Promise.all(allReels.map(async (reel) => {
      const txs = await db.select().from(transactions).where(eq(transactions.reelId, reel.id));
      
      let stock = 0;
      for (const tx of txs) {
        if (tx.type === 'inward' || tx.type === 'opening') {
          stock += tx.quantity;
        } else if (tx.type === 'usage') {
          stock -= tx.quantity;
          // Add back bit reel weight (carried forward to next day)
          if (tx.bitReelKg) {
            stock += tx.bitReelKg;
          }
        }
      }
      
      return { ...reel, currentStock: stock };
    }));

    return reelsWithStock;
  }

  async getReel(id: number): Promise<(ReelWithStock & { transactions: Transaction[] }) | undefined> {
    const [reel] = await db.select().from(reels).where(eq(reels.id, id));
    if (!reel) return undefined;

    const txs = await db.select()
      .from(transactions)
      .where(eq(transactions.reelId, id))
      .orderBy(desc(transactions.date));

    let stock = 0;
    for (const tx of txs) {
      if (tx.type === 'inward' || tx.type === 'opening') {
        stock += tx.quantity;
      } else if (tx.type === 'usage') {
        stock -= tx.quantity;
        // Add back bit reel weight (carried forward to next day)
        if (tx.bitReelKg) {
          stock += tx.bitReelKg;
        }
      }
    }

    return { ...reel, currentStock: stock, transactions: txs };
  }

  async createReel(insertReel: InsertReel): Promise<Reel> {
    // Generate Unique Code: SIZE-GSM-SHADE
    const code = `${insertReel.size}-${insertReel.gsm}-${insertReel.shade.toUpperCase()}`;
    
    const [reel] = await db.insert(reels).values({
      ...insertReel,
      code,
    }).returning();
    return reel;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(transaction).returning();
    return tx;
  }

  async deleteReel(id: number): Promise<void> {
    // Check if reel has any transactions
    const txs = await db.select().from(transactions).where(eq(transactions.reelId, id));
    if (txs.length > 0) {
      throw new Error("Cannot delete reel with existing transactions. Delete all transactions first.");
    }
    
    await db.delete(reels).where(eq(reels.id, id));
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction> {
    const [tx] = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return tx;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }
}

export const storage = new DatabaseStorage();
