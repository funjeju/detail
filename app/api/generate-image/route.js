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
      model: "dall-e-3", // Standardize on dall-e-3 as it's the actual model name for ChatGPT Image 3
      prompt: prompt,
      n: 1,
      size: "1024x1792" // Using the maximum vertical ratio supported by dall-e-3
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
