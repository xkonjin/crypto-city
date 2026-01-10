/**
 * Server-side API route for Perplexity News
 * 
 * This keeps the API key secure on the server side
 * instead of exposing it via NEXT_PUBLIC_ prefix.
 */

import { NextResponse } from 'next/server';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/search';

export async function GET(request: Request) {
  // Get API key from server-side only env var
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'News service not configured', simulated: true },
      { status: 200 } // Return 200 with simulated flag instead of error
    );
  }
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'cryptocurrency market news today';
  
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a crypto news researcher. Provide concise, factual summaries of recent crypto news.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[News API] Perplexity error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch news', simulated: true },
        { status: 200 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[News API] Fetch error:', error);
    return NextResponse.json(
      { error: 'News fetch failed', simulated: true },
      { status: 200 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (apiKey) {
    return new NextResponse(null, { status: 200 });
  }
  return new NextResponse(null, { status: 503 });
}
