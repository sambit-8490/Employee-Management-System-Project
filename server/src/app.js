import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import ApiRouter from "./routes/index.js";
import { healthCheck } from "./controllers/health.controller.js";

const app = express();

/* ---------------- LOGGING ---------------- */
app.use(morgan("dev"));

/* ---------------- BODY PARSERS ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- CORS (FIXED) ---------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

/* ---------------- COOKIE PARSER ---------------- */
app.use(cookieParser());

/* ---------------- ROUTES ---------------- */
app.use("/api", ApiRouter);
app.use("/health", healthCheck);

/* ---------------- GLOBAL ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  return res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

export { app };
