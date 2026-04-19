import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Explicit route for the video asset to ensure it's served correctly
  app.get("/video_0.mp4", async (req, res) => {
    const videoPath = path.join(process.cwd(), "public", "video_0.mp4");
    try {
      await fs.access(videoPath);
      console.log(`Serving video from: ${videoPath}`);
      res.sendFile(videoPath);
    } catch (error) {
      console.error(`Video file not found at: ${videoPath}`);
      // Fallback to searching in src/assets just in case
      const fallbackPath = path.join(process.cwd(), "src", "assets", "video_0.mp4");
      try {
        await fs.access(fallbackPath);
        console.log(`Serving video from fallback: ${fallbackPath}`);
        res.sendFile(fallbackPath);
      } catch (fError) {
        // Final fallback: root directory
        const rootPath = path.join(process.cwd(), "video_0.mp4");
        try {
          await fs.access(rootPath);
          console.log(`Serving video from root fallback: ${rootPath}`);
          res.sendFile(rootPath);
        } catch (rError) {
          res.status(404).send("Video not found");
        }
      }
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
