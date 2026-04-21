import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import * as db from "../db/index";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_forge_viral";

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const existing = await db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.run(
      "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
      [userId, email, hashedPassword, "USER"]
    );

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: userId, email, role: "USER" } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user: any = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user.id, email, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const me = async (req: any, res: Response) => {
  try {
    const user: any = await db.get("SELECT id, email, role FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
