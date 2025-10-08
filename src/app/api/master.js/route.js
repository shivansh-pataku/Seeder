import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GET method for sample analysis
// export async function GET() {
//   try {
//     console.log("🤖 Getting sample analysis...");
    
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const result = await model.generateContent("Read the text and structure and find what type of literature it belongs to then find the limitations in text and do : 1. list of limitations 2. suggestions for improvements 3. sources to refer to make it better, qualitative, more reliable, experienced from literature it belongs to. Optional : Current advancements and history on it. Text: Lensing is the method used in determining the mass and distance of celestial objects.");
    
//     const response = await result.response;
//     const content = response.text();
    
//     return NextResponse.json({
//       success: true,
//       content: content, // Changed from Master_content to content
//       timestamp: new Date().toISOString()
//     });
    
//   } catch (error) {
//     console.error("❌ GET Error:", error.message);
//     return NextResponse.json({
//       success: false,
//       error: error.message
//     }, { status: 500 });
//   }
// }

// POST method for custom analysis
export async function POST(request) {
  try {
    console.log("🤖 Processing custom AI analysis...");

    const requestBody = await request.json(); // Get the full object
    const text = requestBody.text; // Extract the text property
    
    console.log("Received text:", text ? text.substring(0, 50) + "..." : "No text");
    
    if (!text || text.trim() === "") {
      return NextResponse.json({ 
        success: false, 
        error: "No text provided" 
      }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Use the received text, not hardcoded text
    // const prompt = `Mostly you are not getting some professional text rather it would be text form or note of someone working on something you need to help them in enhancing their work, Read the text and structure and find what type of literature it belongs; if it appears fact or facts do verify its correctness; to then find the limitations in text and do : 1. list of limitations 2. suggestions for improvements 3. sources to refer to make it better, qualitative, more reliable, experienced from literature it belongs to. Optional : Current advancements and history on it. Provide the result appering natural not like you are answering prompt. Text: ${text}`;
    // const prompt = await model.generateContent("Read the text and structure and find what type of literature it belongs to then find the limitations in text and do : 1. list of limitations 2. suggestions for improvements 3. sources to refer to make it better, qualitative, more reliable, experienced from literature it belongs to. Optional : Current advancements and history on it. Text: Lensing is the method used in determining the mass and distance of celestial objects.");
const prompt = 

`this is not a professional or a true statement rather you have to identify its belonging or literature it can be linked to

it can be a 
idea just lingered in mind can be sure or unsure about idea rather trying to analyze the idea while writing so you have to first confirm its possibility
or 
academic or professional notes
or
a daily or once in all time experience or a self analysis
or
trying writing a poetry/story/lekh
or 
trying to write a blog or a post
or
a daily task
or
writing some kind or casual/professional document
or 
can be anything 

so
identify it first
most important is that you verify its correctness and authencity then proceed further 
and then

1. list of limitations 
2. suggestions for improvements
3. sources to refer to make it better, qualitative, more reliable, experienced from literature it belongs to.
vision : Current advancements and history on it. Provide the result appearing natural not like you are answering prompt.

exactly according to the text.

Text: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    return NextResponse.json({
      success: true,
      content: content, // Changed from Master_content to content
      originalText: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ POST Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}