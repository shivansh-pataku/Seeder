import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check if API key is loaded
console.log('🔑 API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes ✅' : 'No ❌');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function main() {
  try {
    console.log("Testing Gemini AI...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
 
    const result = await model.generateContent("Read the text and structure and find what type of literature it belongs to then find the limitations in text and do : 1. list of limitations 2. suggestions for improvements 3. sources to refer to make it better, qualitative, more reliable, experienced from literature it belongs to. Optional : Current advancements and history on it. Text: Lensing is the method used in determining the mass and distance of celestial objects.");
    const response = await result.response;
    const Master = response.text();
    
    console.log("AI Response:");
    console.log(text);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();

export default function Integration() {
  return(
    <div>
      <div>
        <div><h1>Master</h1> <span onClick={handleClick}>Analyze</span></div>
        <p>{Master}</p>
     </div>
    </div>
  )

}
