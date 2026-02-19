"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ai } from "@/lib/ai";


export async function generateCoverLetter(data) {

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (!data?.jobDescription) {
    throw new Error("Job description missing");
 }
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
Write a professional cover letter for a ${data.jobTitle} position at ${data.companyName}.

About the candidate:
- Industry: ${user.industry}
- Years of Experience: ${user.experience}
- Skills: ${user.skills?.join(", ")}
- Professional Background: ${user.bio?.slice(0, 300)}


Job Description:
${data.jobDescription}

Keep it under 400 words.
`;

  try {
    // Mock mode for development without consuming Gemini quota
    if (process.env.MOCK_AI === "true") {
      const mockContent = `Dear Hiring Manager,

I am excited to apply for the ${data.jobTitle} position at ${data.companyName}. I bring relevant experience in ${user.industry} along with skills such as ${(user.skills || []).join(
        ", "
      )}, and a track record of delivering high-quality results.
      
Thank you for your time and consideration.

This cover letter was generated in mock mode so you can test the app without calling the real AI API.

Best regards,
${user.name || "Your Name"}`;

      const coverLetter = await db.coverLetter.create({
        data: {
          content: mockContent,
          jobDescription: data.jobDescription,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          status: "completed",
          userId: user.id,
        },
      });

      return coverLetter;
    }

    // Real AI call (uses Gemini quota)
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const content =
      response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("AI returned empty response");
    }

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    if (error?.status === 429 || error?.message?.includes("429")) {
      throw new Error("AI quota exceeded. Enable billing to continue.");
    }
    console.error("Error generating cover letter:", error);
    throw new Error(
      "Failed to generate cover letter. Please try again in a minute."
    );
  }
}




export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}