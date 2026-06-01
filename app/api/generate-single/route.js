import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a senior advertising designer and performance marketer creating Naver Smart Store detail page images using Image2.
Given a product description (brand name, key features, etc.) and a SPECIFIC SECTION TITLE to generate, output exactly ONE object (JSON) representing the prompt and copy for that specific image section.
The object must contain exactly the following fields:
- id: unique short id (e.g., "section-1")
- section: the section title you were asked to generate (e.g., "1. Hook (모델 등장)")
- height: recommended vertical height in pixels as a string (e.g., "2000px")
- mainCopy: main headline copy (one sentence)
- subCopy: sub copy (one or two sentences)
- points: array of 3-5 short bullet points (supporting messages)
- trustElement: a single trust/credibility element (review count, rating, certification, etc.)
- fontStyle: short description of typography for this image (e.g., "헤드라인: S-Core Dream Bold, 본문: Pretendard Regular")
- imagePrompt: the exact prompt for Image2 generation. Include the common Image2 rules:
  * photorealistic, commercial photography, natural lighting, minimal background, clean ecommerce design, realistic texture, avoid excessive staging.
  * CRITICAL 1: Must explicitly instruct the AI to leave empty/negative space (e.g., "vast clean negative space on the left side for text overlay").
  * Also embed the required image size: "width 860px, height <height>".

Return pure JSON (a single object, NOT an array) covering ONLY the requested section. Do not add any extra explanatory text.`;

export async function POST(request) {
  try {
    const { productInfo, sectionTitle, sectionId } = await request.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing on the server.' }, { status: 500 });
    }

    const userPrompt = `--- User Product Info ---\n${productInfo}\n\n--- TARGET SECTION TO GENERATE ---\nTitle: ${sectionTitle}\nID: ${sectionId}\nPlease generate the JSON object for THIS specific section.`;

    const body = {
      contents: [{ 
        role: 'user', 
        parts: [
          { text: SYSTEM_PROMPT + "\n\n" + userPrompt }
        ] 
      }],
      generationConfig: { 
        temperature: 0.7,
        responseMimeType: "application/json"
      },
      safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }],
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("JSON Parse failed, returning raw content:", cleanContent);
      return NextResponse.json({ error: "Gemini returned invalid JSON format." }, { status: 500 });
    }

    // Ensure we return the exact ID and section title requested
    parsedJson.id = sectionId;
    parsedJson.section = sectionTitle;

    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
