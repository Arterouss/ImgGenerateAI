import { NextRequest, NextResponse } from "next/server";

const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Helper function to call DeepSeek / GLM via streaming to prevent Cloudflare 524 Timeout & get instant SVG
async function generateSvgViaLlm(prompt: string, model: string, token: string, baseUrl: string) {
  let llmModel = "deepseek/deepseek-v4-pro";
  if (model.includes("qwen")) llmModel = "qwen/qwen3.5-397b-a17b";
  else if (model.includes("flash") || model.includes("fast")) llmModel = "deepseek/deepseek-v4-flash";
  else if (model.includes("glm")) llmModel = "z-ai/glm-5.1";

  const systemPrompt = `You are a world-class digital artist, UI designer, and expert vector SVG illustrator.
Your task is to create a visually stunning, vibrant, highly intricate, self-contained vector artwork in pure SVG format based on the user's prompt.
RULES:
1. Output ONLY valid XML/SVG code starting with <svg> and ending with </svg>. Do not wrap in markdown quotes if possible, or if wrapped, make sure the inside is clean.
2. Use viewBox="0 0 800 800" and width="100%" height="100%" xmlns="http://www.w3.org/2000/svg".
3. Use striking, vibrant colors, smooth linearGradient/radialGradient definitions, glow filters (<filter id="glow">), geometric depth, dynamic lighting, and rich layered shapes.
4. Make the design feel premium, artistic, modern, and visually captivating.`;

  // We use stream: true so Cloudflare never hits 524 Timeout!
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": DEFAULT_USER_AGENT
    },
    body: JSON.stringify({
      model: llmModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a breathtaking, colorful vector SVG illustration for: "${prompt}"` }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error AI Vector Studio (Status ${response.status}): ${errorText.slice(0, 150)}`);
  }

  // Read the stream chunk by chunk
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Gagal membaca aliran data (stream) dari server TokenGo.");
  }

  const decoder = new TextDecoder();
  let accumulatedText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkStr = decoder.decode(value, { stream: true });
    const lines = chunkStr.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const deltaContent = parsed.choices?.[0]?.delta?.content || "";
          accumulatedText += deltaContent;
        } catch (e) {
          // Ignore incomplete json chunks in stream
        }
      }
    }
  }

  // Extract pure <svg>...</svg> from accumulated content
  const svgMatch = accumulatedText.match(/<svg[\s\S]*?<\/svg>/i);
  if (!svgMatch) {
    throw new Error("AI berhasil merespons tetapi tidak menghasilkan format SVG yang valid. Coba ulangi dengan prompt lebih singkat.");
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
    note: `Dilukis secara real-time (Anti-Timeout) menggunakan ${llmModel.split("/").pop()} Vector AI`
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
    if (model.includes("vector") || model.includes("deepseek") || model.includes("qwen") || model.includes("svg") || model.includes("glm") || model.includes("flash")) {
      const svgResult = await generateSvgViaLlm(prompt, model, token, baseUrl);
      return NextResponse.json(svgResult);
    }

    // Attempt standard DALL-E / FLUX image generation first
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": DEFAULT_USER_AGENT
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
    // automatically fallback to generating a high-res AI Vector SVG Masterpiece via Streaming!
    if (!response.ok) {
      const errMsg = (data.error?.message || data.message || "").toLowerCase();
      if (
        errMsg.includes("no available channel") || 
        errMsg.includes("model_not_found") || 
        response.status === 503 || 
        response.status === 500 ||
        response.status === 400
      ) {
        console.log(`[Smart Fallback] Model ${model} tidak aktif di channel TokenGo. Mengalihkan ke Streaming Vector AI...`);
        try {
          const fallbackResult = await generateSvgViaLlm(prompt, "deepseek/deepseek-v4-pro", token, baseUrl);
          return NextResponse.json({
            ...fallbackResult,
            fallback_notice: `⚠️ Model ${model} belum diaktifkan oleh distributor di API Key kamu. Sistem otomatis mengalihkan ke Streaming DeepSeek Vector Studio (Anti-Timeout) dan berhasil melukis Vector Artwork ini!`
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
