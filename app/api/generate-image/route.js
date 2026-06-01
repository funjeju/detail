import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is missing on the server.' }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const body = {
      model: "gpt-image-2", // The user's specified 2026 ChatGPT Image 2.0 API model
      prompt: prompt,
      n: 1,
      size: "1024x1792" // Using the maximum vertical ratio supported by standard OpenAI APIs
    };

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API Error:", err);
      // Fallback: If gpt-image-2 is not found (e.g. key doesn't have access), try dall-e-3
      if (response.status === 404 || err.includes("model_not_found")) {
         console.log("gpt-image-2 not found, falling back to dall-e-3...");
         const fallbackBody = { ...body, model: "dall-e-3" };
         const fallbackResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(fallbackBody)
         });
         
         if (!fallbackResponse.ok) {
           const fallbackErr = await fallbackResponse.text();
           return NextResponse.json({ error: `Fallback failed: ${fallbackResponse.status} ${fallbackErr}` }, { status: fallbackResponse.status });
         }
         
         const fallbackData = await fallbackResponse.json();
         const imageUrl = fallbackData.data[0].url;
         return NextResponse.json({ imageUrl });
      }
      return NextResponse.json({ error: `OpenAI request failed: ${response.status} ${err}` }, { status: response.status });
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'OpenAI returned no image URL' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
