import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST method for custom analysis
export async function POST(request) {
  try {
    console.log("Processing custom AI analysis...");

    const requestBody = await request.json(); // Get the full object
    const text = requestBody.text; // Extract the text property
    
    console.log("Received text:", text ? text.substring(0, 50) + "..." : "No text");
    
    if (!text || text.trim() === "") {
      return NextResponse.json({ 
        success: false, 
        error: "No text provided" 
      }, { status: 400 });
    }

    let result;
    const candidateModels = ["gemini-3.8-flash", "gemini-3.6-flash"];
    let lastError = null;

    const prompt = `You are "Master AI", an elite literary editor, essayist, and writing mentor for independent authors, essayists, and creative thinkers.

Your mission is to read the writer's draft and deliver high-octane, insightful, and profoundly constructive editorial feedback. Never sound like a generic chatbot, a schoolteacher grading an essay, or a stale Wikipedia article. Speak with the warmth, candor, and perceptive eye of a seasoned editor at The Atlantic, The Paris Review, or FSG.

Analyze the draft and structure your response with the following crisp, beautiful Markdown sections:

### 1. The Core Pulse & Intention
In 2-3 vivid sentences, capture the beating heart of this piece: What is the writer truly trying to express or discover? What is its genre, emotional temperature, and narrative ambition?

### 2. What Grips & What Drags
• **What Soars**: Highlight the strongest phrases, genuine ideas, or resonant imagery that immediately work.
• **What Stagnates**: Candidly pinpoint what dulls the piece—clichés, vague abstractions, pacing slumps, passive voice, or disjointed transitions.

### 3. Craft & Structural Polish
Provide 2-3 specific, actionable techniques to take this piece from good to unforgettable:
- Pacing & Cadence: How can the sentence rhythm be sharpened?
- Specificity & Sensory Depth: Where can vague ideas be anchored in tangible details?
- Thematic Cohesion: What question or motif should be pushed deeper?

### 4. The Master's Polish (Inspired Rewrite)
Take a key paragraph or sentence from the draft that has potential, and provide a masterfully rewritten version that showcases rhythm, clarity, and voice. Briefly explain why these editorial choices make it sing.

### 5. Literary Touchstones
Recommend 1-2 authors, essays, or specific works whose style or narrative approach the writer can study for this specific piece.

Guidelines:
- Keep the critique alive, engaging, and inspiring.
- Respect the writer's authentic voice; never flatten it into corporate or academic monotony.
- If there are glaring grammatical or spelling errors, fix them effortlessly within your rewrite and critique.

Writer's Text:
${text}`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying fallback...`, err.message);
      }
    }

    if (!result) {
      throw lastError || new Error("Failed to generate AI analysis");
    }

    const response = await result.response;
    const content = response.text();

    return NextResponse.json({
      success: true,
      content: content,
      originalText: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("POST Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
