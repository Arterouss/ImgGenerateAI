import { NextRequest, NextResponse } from "next";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model = "dall-e-3", size = "1024x1024", quality = "standard", apiKey } = body;

    const token = apiKey || process.env.TOKENGO_API_KEY || "TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN";
    const baseUrl = process.env.TOKENGO_BASE_URL || "https://api.tokengo.com/v1";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt tidak boleh kosong" }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        quality,
        n: 1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Gagal membuat gambar dari TokenGo API" },
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
