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

    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    } catch {
      model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }
    
    const prompt = 
`Before analyzing or improving any given text, first identify what kind of writing it is — not just by form, but by intention. It could be:
anything from a personal reflection, a technical explanation, a creative story, an academic argument, or a casual note, a blog, an internet post and so forth.

Step 1: Context Identification

Determine the belonging or literary/creative context of the text.
Ask:
What is the writer trying to do or express?
Is the tone exploratory, analytical, emotional, experimental, or practical?
Does it connect to any existing form of literature, theory, expression, or genre, and if so, which one?

-- dont reflect the above in response --

Step 2: Authenticity & Correctness Check
Before evaluation, verify the possibility, correctness, and authenticity of the content.
Is the idea logically or emotionally consistent?
Does it reflect genuine experience, imagination, or research, or is it derivative or superficial?
Is it reliable in its claims, or intentionally speculative?
If the text contains factual claims, verify their accuracy using trusted sources. If verification is not possible, note this in your evaluation.

Step 3: Evaluation Framework
After confirming authenticity, provide:
List of Limitations – what constrains or weakens the text (clarity, coherence, depth, tone, structure, factual gaps).
Suggestions for Improvement – how to refine expression, strengthen authenticity, or align better with its intended form or audience.
Focus well on - Sources or References – mention key readings, frameworks, or literary traditions to explore (e.g., creative nonfiction, stream-of-consciousness, academic essaying, etc.).
Vision: History and Current Advancements – connect the text or its idea to broader movements or current discourse in the relevant field or genre.

Step 4: Since you have analysed the text-type and confirmed its authenticity, help the writer to improve its writing in the related context. (eg: if it is a personal reflection, help them deepen their introspection; if it is a technical explanation, help them clarify and structure their points; if it is a creative story, help them enhance imagery and emotional impact; if it is an academic argument, help them strengthen logic and evidence; if it is a casual note or internet post, help them make it engaging and clear, if it blog help them to write better and so on by telling what is missing).
Do find the grammar and spelling mistakes and correct them.

Guidelines:
Keep the response natural, interpretive, and humane — as though engaging with a living idea, not grading an assignment. Avoid robotic evaluation or rigid correctness. Dont include the steps and guidelines in the response. Just provide the analysis and improvement suggestions. Only give your improvised version in case of grammatical, structural improvement otherwise agitate writer to rewrite better.

Text: ${text}`;

    const result = await model.generateContent(prompt);
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
