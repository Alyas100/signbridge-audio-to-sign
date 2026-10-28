import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      const glossText = text.toUpperCase().replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean).join(" ");
      return NextResponse.json({ gloss: glossText });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Convert the following English text to ASL gloss (sign language gloss notation in uppercase, using standard ASL gloss conventions). Only return the gloss tokens, no explanation: ${text}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const gloss = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase().replace(/\n/g, " ") || text.toUpperCase();
    
    return NextResponse.json({ gloss });
  } catch (error) {
    const { text } = await request.json().catch(() => ({ text: "" }));
    const glossText = text?.toUpperCase().replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean).join(" ") || "";
    return NextResponse.json({ gloss: glossText });
  }
}
