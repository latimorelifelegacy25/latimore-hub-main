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
    const recipient = String(body.recipient || 'My Loved Ones').slice(0, 200);
    const message = String(body.message || '').slice(0, 1000);
    const tone = String(body.tone || 'Heartfelt and loving').slice(0, 100);

    const prompt = `Write a legacy letter addressed to: ${recipient}. The core values or lesson to convey is: "${message}". The tone of the letter should be: ${tone}.`;
    const systemPrompt = "You are a thoughtful and eloquent assistant helping a user write a Legacy Letter to their loved ones. Focus on emotional depth, core values, love, preparedness, and legacy. Do not include placeholders like [Your Name]. Write only the body of the letter. Keep it between 100 and 200 words.";

    const text = await callGemini(prompt, systemPrompt);
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Legacy letter generation failed.' }, { status: 500 });
  }
}
