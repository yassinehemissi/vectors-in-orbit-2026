"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { ActivityLog } from "@/models/ActivityLog";

export async function logActivity({
  userId,
  title,
  detail,
  type,
  metadata,
}: {
  userId: mongoose.Types.ObjectId;
  title: string;
  detail?: string;
  type: string;
  metadata?: Record<string, unknown>;
}) {
  await connectToDatabase();
  await ActivityLog.create({ userId, title, detail, type, metadata });
}

export async function listRecentActivity(
  userId: mongoose.Types.ObjectId,
  limit = 6,
  type?: string
) {
  await connectToDatabase();
  const query = type ? { userId, type } : { userId };
  const items = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return items.map((item) => ({
    title: item.title,
    detail: item.detail ?? "",
    time: item.createdAt?.toISOString() ?? new Date().toISOString(),
    metadata: item.metadata ?? {},
  }));
}

export async function listActivityPage(
  userId: mongoose.Types.ObjectId,
  page = 1,
  pageSize = 20
) {
  await connectToDatabase();
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    ActivityLog.countDocuments({ userId }),
  ]);

  return {
    total,
    page,
    pageSize,
    items: items.map((item) => ({
      title: item.title,
      detail: item.detail ?? "",
      time: item.createdAt?.toISOString() ?? new Date().toISOString(),
      metadata: item.metadata ?? {},
    })),
  };
}
