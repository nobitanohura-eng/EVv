import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { initDb } from "./src/backend/db.js";
import { initTelegramAPI } from "./src/backend/telegramAPI.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize DB
  initDb();

  // Initialize API Routes
  initTelegramAPI(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Prevent Render from sleeping by pinging self every 14 minutes
    const appUrl = process.env.APP_URL;
    if (appUrl) {
      console.log("Starting self-ping service for", appUrl);
      setInterval(() => {
        fetch(`${appUrl}/api/telegram/status`)
          .then(() => console.log('Self-ping successful'))
          .catch(err => console.error('Self-ping failed:', err.message));
      }, 14 * 60 * 1000); // 14 minutes
    }
  });
}

startServer();
