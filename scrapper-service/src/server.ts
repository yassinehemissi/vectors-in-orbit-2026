import express from "express";
import { filesRouter } from "./routes/files";

export const app = express();

app.use("/files", filesRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
