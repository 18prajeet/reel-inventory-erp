import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Passport Auth
  setupAuth(app);

  // === Auth Middleware ===
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send("Unauthorized");
  };

  // === Reels Routes ===
  app.get(api.reels.list.path, requireAuth, async (req, res) => {
    const reels = await storage.getReels();
    res.json(reels);
  });

  app.get(api.reels.get.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const reel = await storage.getReel(id);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }
    res.json(reel);
  });

  app.post(api.reels.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.reels.create.input.parse(req.body);
      const reel = await storage.createReel(input);
      res.status(201).json(reel);
    } catch (err) {
      // Check for duplicate key error (Postgres error code 23505)
      if (err instanceof Error && 'code' in err && err.code === '23505') {
         return res.status(409).json({ message: "A reel with this Size, GSM, and Shade already exists." });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Transactions Routes ===
  app.post(api.transactions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      
      // Validation: Check if reel exists
      const reel = await storage.getReel(input.reelId);
      if (!reel) {
        return res.status(404).json({ message: "Reel not found" });
      }

      // Validation: Prevent negative stock
      if (input.type === 'usage') {
        const bitReelKg = input.bitReelKg || 0;
        const totalDeduction = input.quantity + bitReelKg;
        
        // Validation: usageKg + bitReelKg must not exceed available stock
        if (reel.currentStock < totalDeduction) {
           return res.status(400).json({ 
             message: `Insufficient stock. Available: ${reel.currentStock.toFixed(2)} KG, Requested: ${totalDeduction.toFixed(2)} KG (Usage: ${input.quantity.toFixed(2)} + Bit Reel: ${bitReelKg.toFixed(2)} KG).` 
           });
        }
      }

      const tx = await storage.createTransaction(input);
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  await seedDatabase();

  return httpServer;
}

// Seed function to create initial user and some data
export async function seedDatabase() {
  const admin = await storage.getUserByUsername("admin");
  if (!admin) {
    console.log("Seeding admin user...");
    const hashedPassword = await hashPassword("password123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword
    });
  }
}
