"use server";

import { authOptions } from "@/auth";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { createResearch, addResearchItem } from "@/storage/research";
import { logActivity } from "@/storage/activity";
import { getExperimentByKey, getExperimentTitle } from "@/storage/experiments";
import { getItemByKey, getItemTitle } from "@/storage/items";
import { getPaperById } from "@/storage/papers";
import { getSectionById } from "@/storage/sections";
import { getBlockById } from "@/storage/blocks";
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
    const displayTitle = await (async () => {
      if (kind === "paper") {
        const paper = await getPaperById(itemId);
        return paper?.title ?? "Untitled paper";
      }
      if (kind === "section" && paperId) {
        const section = await getSectionById(paperId, itemId);
        return section?.title ?? "Untitled section";
      }
      if (kind === "block" && paperId) {
        const block = await getBlockById(paperId, itemId);
        return block?.type ? `${block.type} block` : "Block";
      }
      if (kind === "experiment" && paperId) {
        const experiment = await getExperimentByKey(paperId, itemId);
        return experiment ? getExperimentTitle(experiment) : "Untitled experiment";
      }
      if (kind === "item" && paperId) {
        const item = await getItemByKey(paperId, itemId);
        return item ? getItemTitle(item) : "Untitled item";
      }
      return "Untitled item";
    })();
    await logActivity({
      userId: user._id,
      title: "Saved item to research",
      detail: displayTitle,
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
