"use server";

import { authOptions } from "@/auth";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { createResearch, addResearchItem } from "@/storage/research";
import { logActivity } from "@/storage/activity";
import { revalidatePath } from "next/cache";

type CreateResearchState = {
  error?: string | null;
  success?: boolean;
};

export async function createResearchAction(
  _prevState: CreateResearchState,
  formData: FormData
): Promise<CreateResearchState> {
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";

  if (!title) {
    return { error: "Title is required." };
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { error: "You must be signed in." };
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user) {
    return { error: "User not found." };
  }

  try {
    await createResearch({ userId: user._id, title, description });
    await logActivity({
      userId: user._id,
      title: "Created research collection",
      detail: title,
      type: "research_create",
    });
    revalidatePath("/dashboard/research");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create research.";
    return { error: message };
  }
}

type SaveResearchState = {
  error?: string | null;
  success?: boolean;
};

export async function saveResearchItemAction(
  _prevState: SaveResearchState,
  formData: FormData
): Promise<SaveResearchState> {
  const researchId = formData.get("researchId")?.toString() ?? "";
  const kind = formData.get("kind")?.toString() ?? "";
  const itemId = formData.get("itemId")?.toString() ?? "";
  const paperId = formData.get("paperId")?.toString() ?? "";
  const notes = formData.get("notes")?.toString() ?? "";

  if (!researchId || !kind || !itemId) {
    return { error: "Missing required fields." };
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { error: "You must be signed in." };
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user) {
    return { error: "User not found." };
  }

  try {
    await addResearchItem({
      userId: user._id,
      researchId: new mongoose.Types.ObjectId(researchId),
      kind: kind as any,
      itemId,
      paperId: paperId || undefined,
      notes: notes || undefined,
    });
    await logActivity({
      userId: user._id,
      title: "Saved item to research",
      detail: `${kind} · ${itemId}`,
      type: "research_item_add",
      metadata: { researchId, paperId },
    });
    revalidatePath(`/dashboard/research/${researchId}`);
    revalidatePath("/dashboard/research");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save item.";
    return { error: message };
  }
}
