import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";
import { createReadStream, statSync } from "node:fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), "public")));

  const CONFIG_PATH = path.join(process.cwd(), "app-config.json");

  // Get shared app configuration
  app.get("/api/config", async (req, res) => {
    try {
      const exists = await fs.access(CONFIG_PATH).then(() => true).catch(() => false);
      if (!exists) {
        return res.json({ sheetUrl: "" });
      }
      const data = await fs.readFile(CONFIG_PATH, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read configuration" });
    }
  });

  // Save shared app configuration
  app.post("/api/config", async (req, res) => {
    try {
      const { sheetUrl } = req.body;
      await fs.writeFile(CONFIG_PATH, JSON.stringify({ sheetUrl }, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // Google Sheets Proxy to avoid CORS issues
  app.get("/api/proxy-sheet", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Missing sheet URL" });
      }

      // Convert typical Google Sheet URL to Export CSV URL if needed
      let exportUrl = url;
      if (url.includes('docs.google.com/spreadsheets/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }

      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(`Google Sheets responded with ${response.status}: ${response.statusText}`);
      }

      const csvData = await response.text();
      res.header("Content-Type", "text/csv");
      res.send(csvData);
    } catch (error: any) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: error.message || "Failed to proxy sheet data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
