import { NextRequest, NextResponse } from "next";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const apiKey = formData.get("apiKey") as string;
    const token = apiKey || process.env.TOKENGO_API_KEY || "TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN";
    const baseUrl = process.env.TOKENGO_BASE_URL || "https://api.tokengo.com/v1";
    const prompt = (formData.get("prompt") as string) || "Transform image";

    if (formData.has("apiKey")) {
      formData.delete("apiKey");
    }

    if (!formData.has("model")) {
      formData.append("model", "dall-e-2");
    }

    const response = await fetch(`${baseUrl}/images/edits`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
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

    // SMART FALLBACK for Edit: if DALL-E 2 channel is blocked, fallback to DeepSeek Vector Studio
    if (!response.ok) {
      const errMsg = (data.error?.message || data.message || "").toLowerCase();
      if (
        errMsg.includes("no available channel") || 
        errMsg.includes("model_not_found") || 
        response.status === 503 || 
        response.status === 500 ||
        response.status === 400
      ) {
        console.log(`[Smart Fallback Edit] Model dall-e-2 tidak aktif di channel TokenGo. Menggunakan DeepSeek V4 Pro Vector Edit...`);
        try {
          const systemPrompt = `You are a world-class digital vector artist and graphic illustrator.
The user wants to edit/transform a visual concept with the following instruction: "${prompt}".
Generate a standalone, visually breathtaking vector SVG artwork representing this modified concept.
RULES:
1. Output ONLY valid XML/SVG code starting with <svg> and ending with </svg>.
2. Use viewBox="0 0 800 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg".
3. Use striking, vibrant modern colors, gradients, glow filters, and rich shapes.`;

          const llmRes = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              model: "deepseek/deepseek-v4-pro",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Create a modified vector artwork based on instruction: ${prompt}` }
              ],
              temperature: 0.8
            })
          });

          const llmJson = await llmRes.json();
          if (llmRes.ok && llmJson.choices?.[0]?.message?.content) {
            const rawContent = llmJson.choices[0].message.content;
            const svgMatch = rawContent.match(/<svg[\s\S]*?<\/svg>/i);
            if (svgMatch) {
              const cleanSvg = svgMatch[0];
              const base64Svg = Buffer.from(cleanSvg, "utf-8").toString("base64");
              return NextResponse.json({
                data: [{ url: `data:image/svg+xml;base64,${base64Svg}`, svg: cleanSvg }],
                success: true,
                fallback_notice: `⚠️ Channel DALL-E 2 belum aktif di akunmu. Sistem otomatis menghasilkan desain Vector AI menggunakan DeepSeek V4 Pro berdasarkan instruksimu!`
              });
            }
          }
        } catch (fallbackErr) {
          // Ignore and throw original error below
        }
      }

      return NextResponse.json(
        { error: data.error?.message || data.message || `Gagal mengedit gambar (Status ${response.status})` },
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
