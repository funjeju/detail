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
      size: "1024x1792"
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
      return NextResponse.json({ error: `OpenAI request failed: ${response.status} ${err}` }, { status: response.status });
    }

    const data = await response.json();
    const item = data.data && data.data[0];
    
    if (!item) {
      console.error("Missing data in OpenAI response:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: `OpenAI returned invalid format: ${JSON.stringify(data)}` }, { status: 500 });
    }

    let imageUrl = item.url;
    if (!imageUrl && item.b64_json) {
      imageUrl = `data:image/png;base64,${item.b64_json}`;
    }
    
    if (!imageUrl) {
      console.error("Missing URL or base64 in OpenAI response:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: `OpenAI returned no image URL. Full response: ${JSON.stringify(data)}` }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
