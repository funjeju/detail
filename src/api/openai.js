// src/api/openai.js

/**
 * Calls OpenAI Chat Completion API to generate the full set of Image2 prompts
 * based on the product information provided by the user.
 *
 * Vite exposes environment variables prefixed with VITE_ via `import.meta.env`.
 * Ensure a .env file contains VITE_OPENAI_API_KEY=YOUR_KEY.
 */

const SYSTEM_PROMPT = `You are a senior advertising designer and performance marketer creating Naver Smart Store detail page images using Image2.
Given a product description (brand name, key features, etc.), output an array of objects (in JSON) where each object represents one image section.
Each object must contain the following fields exactly:
- id: a unique short id (e.g., "section-1")
- section: the section title (e.g., "1. Hook (모델 등장)")
- height: the recommended vertical height in pixels (as a string, e.g., "2000px")
- mainCopy: the main headline copy (one sentence)
- subCopy: the sub copy (one or two sentences)
- points: an array of 3‑5 short bullet points (supporting messages)
- trustElement: a single trust/credibility element (review count, rating, certification, etc.)
- fontStyle: a short description of the typography for this image (e.g., "헤드라인: S-Core Dream Bold, 본문: Pretendard Regular")
- imagePrompt: the exact prompt for Image2 generation. Include the common Image2 rules:
  * photorealistic, commercial photography, natural lighting, minimal background, clean ecommerce design, realistic texture, avoid excessive staging.
  * Also embed the required image size: "width 860px, height <height>".

The output must be valid JSON (no markdown code fences) and must contain exactly 10 objects corresponding to the sections defined in the user's specification (Hook, 문제 공감, 해결 제안, 핵심 가치 1‑5, 신뢰 요소, 상세 정보, 구매 전 체크, CTA, plus any bonus if you wish but keep total 10‑12). Do not add any extra explanatory text.
`;

export async function generatePrompts(productInfo) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found in environment (VITE_OPENAI_API_KEY)');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // compact yet strong model; adjust if needed
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: productInfo },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  // The model is instructed to return pure JSON. Parse it safely.
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (e) {
    // If parsing fails, throw with original content for debugging.
    throw new Error(`Failed to parse OpenAI JSON response: ${e.message}\nRaw response: ${content}`);
  }
}
