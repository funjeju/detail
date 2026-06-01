// src/api/gemini.js
/**
 * Calls Google Gemini API to generate the full set of Image2 prompts.
 * Environment variable VITE_GEMINI_API_KEY must be defined (Vite requires VITE_ prefix).
 */

const SYSTEM_PROMPT = `You are a senior advertising designer and performance marketer creating Naver Smart Store detail page images using Image2.
Given a product description (brand name, key features, etc.), output an array of objects (JSON) where each object represents one image section.
Each object must contain exactly the following fields:
- id: unique short id (e.g., "section-1")
- section: section title (e.g., "1. Hook (모델 등장)")
- height: recommended vertical height in pixels as a string (e.g., "2000px")
- mainCopy: main headline copy (one sentence)
- subCopy: sub copy (one or two sentences)
- points: array of 3-5 short bullet points (supporting messages)
- trustElement: a single trust/credibility element (review count, rating, certification, etc.)
- fontStyle: short description of typography for this image (e.g., "헤드라인: S-Core Dream Bold, 본문: Pretendard Regular")
- imagePrompt: the exact prompt for Image2 generation. Include the common Image2 rules:
  * photorealistic, commercial photography, natural lighting, minimal background, clean ecommerce design, realistic texture, avoid excessive staging.
  * Also embed the required image size: "width 860px, height <height>".

Return pure JSON (no markdown) containing exactly 10 objects covering the sections defined by the user (Hook, 문제 공감, 해결 제안, 핵심 가치 5장, 신뢰 요소, 상세 정보, 구매 전 체크, CTA, and optional bonus to keep total 10‑12). Do not add any extra explanatory text.`;

export async function generatePrompts(productInfo) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key missing (VITE_GEMINI_API_KEY)');
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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Gemini returned no content');
  }

  try {
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleanContent);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON response: ${e.message}\nRaw response: ${content}`);
  }
}
