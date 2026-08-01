import "dotenv/config";
import { getDb, initDb } from "./src/backend/db.js";
import { initTelegramAPI } from "./src/backend/telegramAPI.js";
import express from "express";

initDb();
initTelegramAPI(express());
setTimeout(() => process.exit(0), 5000);
