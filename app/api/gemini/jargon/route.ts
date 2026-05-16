import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function callGemini(prompt: string, systemInstructionText: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY environment variable.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstructionText }] },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${details}`);
  }

  const result = await res.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text.');
  return text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jargon = String(body.jargon || '').trim().slice(0, 1000);
    if (!jargon) return NextResponse.json({ ok: false, error: 'Missing term or phrase.' }, { status: 400 });

    const systemPrompt = 'You are an expert, friendly life insurance and financial planning assistant. Explain confusing insurance or financial terms in simple, plain English that an average 8th grader can understand. Keep the explanation under 3 sentences. Use a simple analogy when helpful. Do not give legal, tax, or individualized financial advice.';
    const text = await callGemini(jargon, systemPrompt);
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Jargon translation failed.' }, { status: 500 });
  }
}
