"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ai } from "@/lib/ai";



export async function generateQuiz() {      // check user login or not
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");


  //using gemini
  const prompt = `                                               
    Generate 5 technical interview questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;


  // structuring data
  try {
    // Mock mode: return a fixed quiz without calling Gemini
    if (process.env.MOCK_AI === "true") {
      return {
        questions: [
          {
            question: `What is one core responsibility of a ${
              user.industry || "software"
            } professional?`,
            options: [
              "Writing clear, maintainable code",
              "Ignoring best practices",
              "Avoiding communication with the team",
              "Skipping tests",
            ],
            correctAnswer: "Writing clear, maintainable code",
            explanation:
              "A key responsibility is writing code that is easy to read, maintain, and extend.",
          },
          {
            question: "Which practice helps prevent bugs in production?",
            options: [
              "Writing unit and integration tests",
              "Deploying without review",
              "Editing code directly on the server",
              "Skipping code reviews",
            ],
            correctAnswer: "Writing unit and integration tests",
            explanation:
              "Tests catch issues early and increase confidence in changes.",
          },
        ],
      };
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash", // recommended
      contents: prompt,
    });
    const text = result.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

// saving the result of quiz

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();                         // again user authentication
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await ai.models.generateContent({
        model: "gemini-2.0-flash", // recommended
        contents: improvementPrompt,
      });

      improvementTip = tipResult.text.trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}


//for interview page assesments
export async function getAssessments() {    
  const { userId } = await auth();                 // authorization
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

