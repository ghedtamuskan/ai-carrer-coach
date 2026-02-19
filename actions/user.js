"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

function normalizeDemandLevel(value) {
  if (!value) return "MEDIUM";
  const v = value.toUpperCase();
  return ["HIGH", "MEDIUM", "LOW"].includes(v) ? v : "MEDIUM";
}

function normalizeMarketOutlook(value) {
  if (!value) return "NEUTRAL";
  const v = value.toUpperCase();
  return ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(v) ? v : "NEUTRAL";
}

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  /* ----------------------------------
     1️⃣ Check industry OUTSIDE transaction
  ----------------------------------- */
  let industryInsight = await db.industryInsight.findUnique({
    where: { industry: data.industry },
  });

  let insights = null;

  if (!industryInsight) {
    insights = await generateAIInsights(data.industry);
  }

  /* ----------------------------------
     2️⃣ FAST transaction (DB only)
  ----------------------------------- */
   try{
    const result = await db.$transaction(async (tx) => {
    if (!industryInsight && insights) {
      industryInsight = await tx.industryInsight.create({
        data: {
          industry: data.industry,
          salaryRanges: insights.salaryRanges,
          growthRate: insights.growthRate,
          demandLevel: normalizeDemandLevel(insights.demandLevel),
          topSkills: insights.topSkills,
          marketOutlook: normalizeMarketOutlook(insights.marketOutlook),
          keyTrends: insights.keyTrends,
          recommendedSkills: insights.recommendedSkills,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills,
      },
    });

    return updatedUser;
  });

  revalidatePath("/dashboard");

  return {
    success: true,
   
  };
} catch (error) { console.error("Error updating user and industry:", error.message); throw new Error("Failed to update profile"); } }

export async function getUserOnboardingStatus() {
  try {
    const { userId } = await auth();
    if (!userId) return { isOnboarded: false };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { industry: true },
    });

    return { isOnboarded: Boolean(user?.industry) };
  } catch (error) {
    console.error("Onboarding check failed:", error);
    return { isOnboarded: false }; // NEVER throw here
  }
}
