"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";76
import { ai } from "@/lib/ai";


// Helper normalizers (mirroring user actions)
function normalizeDemandLevel(value) {
  if (!value) return "MEDIUM";
  const v = value.toString().toUpperCase();
  return ["HIGH", "MEDIUM", "LOW"].includes(v) ? v : "MEDIUM";
}

function normalizeMarketOutlook(value) {
  if (!value) return "NEUTRAL";
  const v = value.toString().toUpperCase();
  return ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(v) ? v : "NEUTRAL";
}


export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;
  try {
    // Mock mode: return fixed insights without calling Gemini
    if (process.env.MOCK_AI === "true") {
      return {
        salaryRanges: [
          {
            role: "Mid-level Professional",
            min: 60000,
            max: 90000,
            median: 75000,
            location: "Global",
          },
        ],
        growthRate: 10,
        demandLevel: "HIGH",
        topSkills: ["Problem Solving", "Communication", "Teamwork"],
        marketOutlook: "POSITIVE",
        keyTrends: ["AI Adoption", "Remote Work"],
        recommendedSkills: ["Cloud Basics", "Data Literacy"],
      };
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash", // recommended
      contents: prompt,
    });
    const text = result.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("❌ AI Generation Error:", error);
    return {
      salaryRanges: [],
      growthRate: 0,
      demandLevel: "MEDIUM",
      topSkills: [],
      marketOutlook: "NEUTRAL",
      keyTrends: ["Data not available"],
      recommendedSkills: [],
    };
  }
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });
 
  if (!user) throw new Error("User not found");

  // If industry is not set yet, don't try to create a DB record with null industry
  if (!user.industry) {
    return {
      industry: "Unknown",
      salaryRanges: [],
      growthRate: 0,
      demandLevel: "MEDIUM",
      topSkills: [],
      marketOutlook: "NEUTRAL",
      keyTrends: ["Set your industry in your profile to see tailored insights."],
      recommendedSkills: [],
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }
  
  // If no insights exist, generate them
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
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
    
    return industryInsight;
  }

  return user.industryInsight;

}