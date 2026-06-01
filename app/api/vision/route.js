import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageBase64 = formData.get('imageBase64');
    const mimeType = formData.get('mimeType');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing on the server.' }, { status: 500 });
    }

    const body = {
      contents: [{
        role: 'user',
        parts: [
          { text: "이 이미지는 스마트스토어 상품 이미지 또는 패키지입니다. 이미지에 보이는 상품의 이름, 브랜드, 주요 특징, 효능, 타겟 고객 등을 상세하게 텍스트로 추출하고 분석해주세요. 상세페이지 기획에 사용할 수 있도록 구체적으로 적어주세요." },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64.split(',')[1] // remove data:image/png;base64, prefix
            }
          }
        ]
      }],
      generationConfig: { temperature: 0.4 },
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Gemini Vision request failed: ${response.status} ${err}` }, { status: response.status });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return NextResponse.json({ error: 'Gemini returned no content' }, { status: 500 });
    }

    return NextResponse.json({ productInfo: content });

  } catch (error) {
    console.error('Vision API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
