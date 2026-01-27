import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { Research } from "@/models/Research";
import { ResearchItem, type ResearchItemKind } from "@/models/ResearchItem";
import { adjustCredits } from "@/lib/credits";
import { CreditAccount } from "@/models/CreditAccount";

const RESEARCH_CREATE_COST = 5;

export async function createResearch({
  userId,
  title,
  description,
}: {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
}) {
  await connectToDatabase();

  const existing = await Research.findOne({ userId, title });
  if (existing) {
    return existing;
  }

  const creditAccount = await CreditAccount.findOne({ userId });
  if (!creditAccount) {
    throw new Error("Credit account missing.");
  }

  if (creditAccount.balance < RESEARCH_CREATE_COST) {
    throw new Error("Not enough credits to create a research collection.");
  }

  const research = await Research.create({
    userId,
    title,
    description,
  });

  await adjustCredits({
    userId,
    creditAccountId: creditAccount._id,
    delta: -RESEARCH_CREATE_COST,
    reason: "research_create",
    requestId: `research-${research._id.toString()}`,
    metadata: { title },
  });

  return research;
}

export async function listResearch(userId: mongoose.Types.ObjectId) {
  await connectToDatabase();
  return Research.find({ userId }).sort({ updatedAt: -1 }).lean();
}

export async function addResearchItem({
  userId,
  researchId,
  kind,
  itemId,
  paperId,
  notes,
}: {
  userId: mongoose.Types.ObjectId;
  researchId: mongoose.Types.ObjectId;
  kind: ResearchItemKind;
  itemId: string;
  paperId?: string;
  notes?: string;
}) {
  await connectToDatabase();

  return ResearchItem.findOneAndUpdate(
    { userId, researchId, kind, itemId, paperId },
    { userId, researchId, kind, itemId, paperId, notes },
    { upsert: true, new: true }
  );
}

export async function removeResearchItem({
  userId,
  researchId,
  kind,
  itemId,
  paperId,
}: {
  userId: mongoose.Types.ObjectId;
  researchId: mongoose.Types.ObjectId;
  kind: ResearchItemKind;
  itemId: string;
  paperId?: string;
}) {
  await connectToDatabase();

  return ResearchItem.findOneAndDelete({
    userId,
    researchId,
    kind,
    itemId,
    paperId,
  });
}

export async function listResearchItemsGrouped(
  userId: mongoose.Types.ObjectId,
  researchId: mongoose.Types.ObjectId
) {
  await connectToDatabase();

  const items = await ResearchItem.find({ userId, researchId })
    .sort({ createdAt: -1 })
    .lean();

  return items.reduce<Record<ResearchItemKind, typeof items>>(
    (acc, item) => {
      const kind = item.kind as ResearchItemKind;
      acc[kind].push(item);
      return acc;
    },
    {
      experiment: [],
      paper: [],
      section: [],
      block: [],
    }
  );
}
