import { NextRequest, NextResponse } from "next";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model = "deepseek-v4-pro", temperature = 0.7, apiKey } = body;

    const token = apiKey || process.env.TOKENGO_API_KEY || "TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN";
    const baseUrl = process.env.TOKENGO_BASE_URL || "https://api.tokengo.com/v1";

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Gagal mendapatkan respons chat dari TokenGo API" },
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
