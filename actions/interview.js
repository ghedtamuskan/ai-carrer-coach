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
      const industry = user.industry || "General";
      return {
        questions: [
          {
            question: `What is a core focus area for a successful ${industry} professional?`,
            options: [
              "Ignoring current market trends",
              "Using outdated tools and strategies",
              `Understanding ${industry} best practices and methodologies`,
              "Working completely isolated from other departments",
            ],
            correctAnswer: `Understanding ${industry} best practices and methodologies`,
            explanation:
              `Staying updated with ${industry} standards is crucial for long-term career success and delivering quality results.`,
          },
          {
            question: `Which practice helps prevent bugs or errors in production?`,
            options: [
              "Deploying without review",
              "Testing and reviewing work thoroughly before launch",
              "Editing files directly on the live server",
              "Skipping quality assurance checks",
            ],
            correctAnswer: "Testing and reviewing work thoroughly before launch",
            explanation:
              "Tests and reviews catch issues early and increase confidence in your work.",
          },
          {
            question: `Which skill is most critical for advancing in ${industry}?`,
            options: [
              "Refusing to learn new technologies or methods",
              "Avoiding feedback from peers or management",
              "Focusing only on a single, narrow task",
              "Continuous learning and adaptability",
            ],
            correctAnswer: "Continuous learning and adaptability",
            explanation:
              `The ${industry} landscape evolves rapidly, requiring professionals to constantly adapt and acquire new skills.`,
          },
          {
            question: `When dealing with a difficult client or stakeholder in ${industry}, what is the best approach?`,
            options: [
              "Ignore their emails until they give up",
              "Listen actively to their concerns and propose constructive solutions",
              "Argue with them immediately to prove you are right",
              "Pass the problem instantly to someone else without trying",
            ],
            correctAnswer: "Listen actively to their concerns and propose constructive solutions",
            explanation:
              `Professionalism and empathy are critical in ${industry} to maintain strong working relationships and trust.`,
          },
          {
            question: `How should a ${industry} professional handle missing a critical project deadline?`,
            options: [
              "Hide the fact that the deadline was missed",
              "Blame another team member",
              "Communicate the delay early, explain the blocker, and provide a new timeline",
              "Rush the work and deliver a broken or incomplete result",
            ],
            correctAnswer: "Communicate the delay early, explain the blocker, and provide a new timeline",
            explanation:
              "Transparency and proactive communication are highly valued traits when managing expectations.",
          },
          {
            question: `What role does data play in modern ${industry} strategies?`,
            options: [
              "It drives informed decision-making and helps measure success",
              "It is completely irrelevant and mostly a distraction",
              "It is only useful for the IT department",
              "It should be guessed rather than measured",
            ],
            correctAnswer: "It drives informed decision-making and helps measure success",
            explanation:
              `Regardless of your specific role, leveraging data in ${industry} helps optimize outcomes and prove value.`,
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

