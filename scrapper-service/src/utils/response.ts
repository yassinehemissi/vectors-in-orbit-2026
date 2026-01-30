import { Response } from "express";

export function json(res: Response, data: unknown, status = 200) {
  return res.status(status).json(data);
}

export function error(res: Response, message: string, status = 500) {
  return res.status(status).json({ error: message });
}
