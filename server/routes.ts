import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendResetEmail } from "./mailer";


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).send("Unauthorized");
  };
  app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await storage.getUserByEmail(email);

    // 🔐 Do NOT reveal if email exists or not
    if (!user) {
      return res.json({
        message: "If the email exists, a reset link will be sent",
      });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await storage.setPasswordResetToken(user.id, token, expiresAt);

    // 📧 Email sending will come later
    // console.log("Password reset token:", token);
    await sendResetEmail(user.email, token);

    return res.json({
      message: "If the email exists, a reset link will be sent",
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    const user = await storage.resetPasswordWithToken(
      token,
      hashedPassword
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    return res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});



  /* ===================== REELS ===================== */

  app.get(api.reels.list.path, requireAuth, async (_req, res) => {
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

  /* 🔒 PATCHED CREATE REEL */
  app.post(api.reels.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.reels.create.input.parse(req.body);
      const reel = await storage.createReel(input);
      return res.status(201).json(reel);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
       }
  if (err?.code === "23505") {
    return res.status(409).json({
      message: "A reel with this Reel ID already exists.",
    });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
}

  });


  app.put(api.reels.update.path, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.reels.update.input.parse(req.body);

      const reel = await storage.getReel(id);
      if (!reel) {
        return res.status(404).json({ message: "Reel not found" });
      }

      const updated = await storage.updateReel(id, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.reels.delete.path, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reel = await storage.getReel(id);
      if (!reel) {
        return res.status(404).json({ message: "Reel not found" });
      }

      await storage.deleteReel(id);
      res.status(200).send("");
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  /* ===================== TRANSACTIONS ===================== */

  app.post(api.transactions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const tx = await storage.createTransaction(input);
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.transactions.update.path, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.transactions.update.input.parse(req.body);
      const tx = await storage.updateTransaction(id, input);
      res.status(200).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.transactions.delete.path, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTransaction(id);
      res.status(200).send("");
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  /* ===================== BIT REEL UPDATE ===================== */
app.put(api.reels.updateBitReel.path, requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const input = api.reels.updateBitReel.input.parse(req.body);

    const reel = await storage.getReel(id);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    await storage.updateBitReel(id, input.bitReelKg);

    const updated = await storage.getReel(id);
    res.status(200).json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* ===================== CLEAR BIT REEL ===================== */

// app.put("/api/reels/:id/clear-bit-reel", requireAuth, async (req, res) => {
//   try {
//     const id = parseInt(req.params.id);

//     const reel = await storage.getReel(id);
//     if (!reel) {
//       return res.status(404).json({ message: "Reel not found" });
//     }

//     await storage.clearBitReel(id);

//     return res.status(200).json({ message: "Bit reel cleared successfully" });
//   } catch (err) {
//     if (err instanceof Error) {
//       return res.status(400).json({ message: err.message });
//     }
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });



  await seedDatabase();
  return httpServer;
}




/* ===================== SEED ===================== */

export async function seedDatabase() {
  const admin = await storage.getUserByUsername("admin");
  if (!admin) {
    const hashedPassword = await hashPassword("password123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
    });
  }
}
