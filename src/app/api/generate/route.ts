import { NextRequest, NextResponse } from "next";

// Helper function to call DeepSeek / Qwen to generate a stunning vector SVG artwork when DALL-E is not available
async function generateSvgViaLlm(prompt: string, model: string, token: string, baseUrl: string) {
  const llmModel = model.includes("qwen") ? "qwen/qwen3.5-397b-a17b" : "deepseek/deepseek-v4-pro";
  
  const systemPrompt = `You are a world-class digital artist, UI designer, and expert vector SVG illustrator.
Your task is to create a visually stunning, vibrant, highly intricate, self-contained vector artwork in pure SVG format based on the user's prompt.
RULES:
1. Output ONLY valid XML/SVG code starting with <svg> and ending with </svg>. Do not wrap in markdown quotes if possible, or if wrapped, make sure the inside is clean.
2. Use viewBox="0 0 800 800" and width="100%" height="100%" xmlns="http://www.w3.org/2000/svg".
3. Use striking, vibrant colors, smooth linearGradient/radialGradient definitions, glow filters (<filter id="glow">), geometric depth, dynamic lighting, and rich layered shapes.
4. Make the design feel premium, artistic, modern, and visually captivating.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      model: llmModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a breathtaking, colorful vector SVG illustration for: "${prompt}"` }
      ],
      temperature: 0.8
    })
  });

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Gagal memanggil AI SVG Studio: ${responseText}`);
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || `Error AI Vector Studio (Status ${response.status})`);
  }

  const rawContent = data.choices?.[0]?.message?.content || "";
  
  // Extract pure <svg>...</svg> from content
  const svgMatch = rawContent.match(/<svg[\s\S]*?<\/svg>/i);
  if (!svgMatch) {
    throw new Error("AI berhasil merespons tetapi tidak menghasilkan format SVG yang valid.");
  }

  const cleanSvg = svgMatch[0];
  const base64Svg = Buffer.from(cleanSvg, "utf-8").toString("base64");
  const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

  return {
    data: [
      {
        url: dataUri,
        svg: cleanSvg,
        model_used: llmModel,
        type: "vector_svg"
      }
    ],
    success: true,
    note: `Dilukis secara real-time menggunakan ${llmModel.split("/").pop()} Vector AI`
  };
}

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

    const { prompt, model = "deepseek-vector-art", size = "1024x1024", quality = "standard", apiKey } = body;
    const token = apiKey || process.env.TOKENGO_API_KEY || "TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN";
    const baseUrl = process.env.TOKENGO_BASE_URL || "https://api.tokengo.com/v1";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt tidak boleh kosong" }, { status: 400 });
    }

    // If user explicitly chose AI Vector/SVG Art models, or if we want smart generation right away
    if (model.includes("vector") || model.includes("deepseek") || model.includes("qwen") || model.includes("svg")) {
      const svgResult = await generateSvgViaLlm(prompt, model, token, baseUrl);
      return NextResponse.json(svgResult);
    }

    // Attempt standard DALL-E / FLUX image generation first
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

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json(
        { error: `TokenGo API merespons bukan JSON (Status ${response.status}): ${responseText || "Kosong"}` },
        { status: response.status || 500 }
      );
    }

    // SMART FALLBACK: If DALL-E/FLUX is not enabled on this TokenGo key (model_not_found / 503 / 400 / 500),
    // automatically fallback to generating a high-res AI Vector SVG Masterpiece using DeepSeek V4 Pro!
    if (!response.ok) {
      const errMsg = (data.error?.message || data.message || "").toLowerCase();
      if (
        errMsg.includes("no available channel") || 
        errMsg.includes("model_not_found") || 
        response.status === 503 || 
        response.status === 500 ||
        response.status === 400
      ) {
        console.log(`[Smart Fallback] Model ${model} tidak aktif di channel TokenGo. Mengalihkan ke DeepSeek V4 Pro Vector AI...`);
        try {
          const fallbackResult = await generateSvgViaLlm(prompt, "deepseek/deepseek-v4-pro", token, baseUrl);
          return NextResponse.json({
            ...fallbackResult,
            fallback_notice: `⚠️ Model ${model} belum diaktifkan oleh distributor di API Key kamu. Sistem otomatis mengalihkan ke DeepSeek V4 Pro Vector Studio dan berhasil melukis Vector Artwork ini!`
          });
        } catch (fallbackErr: any) {
          return NextResponse.json(
            { error: `Model ${model} tidak tersedia (${data.error?.message || "Channel belum aktif"}), dan fallback SVG gagal: ${fallbackErr.message}` },
            { status: response.status }
          );
        }
      }

      return NextResponse.json(
        { error: data.error?.message || data.message || `Gagal membuat gambar (Status ${response.status})` },
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
