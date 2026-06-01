import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a senior advertising strategist for ecommerce detail pages.
Analyze the user's product information and create a high-converting strategy draft.
You must output ONLY a valid JSON object with the exact following structure, with no markdown formatting or extra text:
{
  "targetModel": "Short description of the target audience and their situation",
  "coreProblems": ["Problem 1", "Problem 2"],
  "coreValues": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5"],
  "purchaseTrigger": "The main psychological trigger or benefit that drives purchase",
  "toneAndColor": "Brand tone and 2 main colors"
}
Keep all text in Korean. Make it sound professional and persuasive.`;

export async function POST(request) {
  try {
    const { productInfo } = await request.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing on the server.' }, { status: 500 });
    }

    const body = {
      contents: [{ 
        role: 'user', 
        parts: [
          { text: SYSTEM_PROMPT + "\n\n--- User Product Info ---\n\n" + productInfo }
        ] 
      }],
      generationConfig: { temperature: 0.7 },
      safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }],
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Gemini request failed: ${response.status} ${err}` }, { status: response.status });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return NextResponse.json({ error: 'Gemini returned no content' }, { status: 500 });
    }

    let cleanContent = content.trim();
    if (cleanContent.startsWith('\`\`\`')) {
      cleanContent = cleanContent.replace(/^\`\`\`(json)?\n?/, '').replace(/\n?\`\`\`$/, '');
    }
    
    const parsedJson = JSON.parse(cleanContent);
    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error('Draft API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
