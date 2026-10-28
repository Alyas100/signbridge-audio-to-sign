import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio files must be 25 MB or smaller." }, { status: 413 });
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);
    
    const response = await fetch("http://localhost:8000/transcribe", {
      method: "POST",
      body: backendFormData,
    });
    
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = data && typeof data.error === "string"
        ? data.error
        : "The transcription service rejected the audio file.";
      return NextResponse.json({ error }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
