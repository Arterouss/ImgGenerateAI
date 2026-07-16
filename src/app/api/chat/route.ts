import { NextRequest, NextResponse } from "next/server";

const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Request body kosong" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Format JSON request tidak valid" }, { status: 400 });
    }

    const { messages, model = "deepseek/deepseek-v4-pro", temperature = 0.7, apiKey } = body;
    const token = apiKey || process.env.TOKENGO_API_KEY || "TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN";
    const baseUrl = process.env.TOKENGO_BASE_URL || "https://api.tokengo.com/v1";

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": DEFAULT_USER_AGENT
      },
      body: JSON.stringify({
        model,
        messages,
        temperature
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json(
        { error: `TokenGo API merespons dengan format bukan JSON (Status ${response.status}): ${responseText || "Kosong"}` },
        { status: response.status || 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || data.message || `Gagal memproses chat (Status ${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan sistem internal" },
      { status: 500 }
    );
  }
}
