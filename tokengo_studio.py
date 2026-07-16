import urllib.request
import json
import time
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Konfigurasi TokenGo API
API_KEY = os.environ.get("TOKENGO_API_KEY", "TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN")
BASE_URL = os.environ.get("TOKENGO_BASE_URL", "https://api.tokengo.com/v1")
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def print_header():
    print("=" * 60)
    print("   ⚡ TOKENGO AI STUDIO (PYTHON ANTI-TIMEOUT ENGINE) ⚡")
    print("   Kekuatan 5 Juta Token - Vector Art & Chat Assistant")
    print("=" * 60)

def generate_vector_art(prompt, model="deepseek/deepseek-v4-pro"):
    print(f"\n🎨 [Generating Vector Art] Model: {model}")
    print(f"👉 Prompt: {prompt}")
    print("⏳ Sedang melukis secara streaming (Anti-Timeout Cloudflare)...")

    system_prompt = (
        "You are a world-class digital artist and vector SVG illustrator. "
        "Create a self-contained, high-quality, vibrant vector artwork in pure SVG format based on the prompt. "
        "RULES:\n1. Output ONLY valid <svg>...</svg> code.\n2. Use viewBox='0 0 800 800' and rich gradients/glows."
    )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Create colorful vector SVG art for: {prompt}"}
        ],
        "temperature": 0.7,
        "max_tokens": 3000,
        "stream": True
    }

    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT
        },
        data=json.dumps(payload).encode("utf-8")
    )

    accumulated_text = ""
    start_time = time.time()
    chunk_count = 0

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            for line in response:
                line_str = line.decode("utf-8").strip()
                if line_str.startswith("data: "):
                    json_str = line_str[6:].strip()
                    if json_str == "[DONE]":
                        break
                    try:
                        chunk_data = json.loads(json_str)
                        choices = chunk_data.get("choices")
                        if choices and isinstance(choices, list) and len(choices) > 0:
                            delta = choices[0].get("delta", {}).get("content", "")
                            if delta:
                                accumulated_text += delta
                                chunk_count += 1
                                if chunk_count % 15 == 0:
                                    print(".", end="", flush=True)
                    except (json.JSONDecodeError, IndexError, KeyError, TypeError):
                        pass
        print(f"\n✅ Selesai dalam {time.time() - start_time:.2f} detik!")

        # Cari tag SVG
        svg_start = accumulated_text.find("<svg")
        svg_end = accumulated_text.rfind("</svg>")
        if svg_start != -1 and svg_end != -1:
            clean_svg = accumulated_text[svg_start:svg_end+6]
            output_file = "generated_artwork.svg"
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(clean_svg)
            print(f"🎉 Sukses! File SVG telah disimpan sebagai: '{os.path.abspath(output_file)}'")
            return clean_svg
        else:
            print("⚠️ AI merespons, tetapi tidak ditemukan tag <svg> yang lengkap.")
            return accumulated_text

    except Exception as e:
        print(f"\n❌ Error saat memanggil TokenGo: {e}")
        return None

def main():
    print_header()
    while True:
        print("\nPilih Menu:")
        print("1. 🎨 Buat Karya Visual Vector SVG (Disimpan ke file .svg)")
        print("2. 💬 AI Chat & Logic Assistant")
        print("3. ❌ Keluar")
        choice = input("👉 Pilihanmu (1/2/3): ").strip()

        if choice == "1":
            prompt = input("\n📝 Masukkan prompt gambar/visual: ").strip()
            if prompt:
                print("\nPilih model:")
                print("a. deepseek/deepseek-v4-pro (Top Tier Quality)")
                print("b. qwen/qwen3.5-397b-a17b (Super Powerful)")
                print("c. deepseek/deepseek-v4-flash (Super Cepat)")
                m_choice = input("👉 Pilihan (a/b/c, default a): ").strip().lower()
                model_map = {
                    "a": "deepseek/deepseek-v4-pro",
                    "b": "qwen/qwen3.5-397b-a17b",
                    "c": "deepseek/deepseek-v4-flash"
                }
                selected_model = model_map.get(m_choice, "deepseek/deepseek-v4-pro")
                generate_vector_art(prompt, selected_model)
        elif choice == "2":
            msg = input("\n👤 Pertanyaanmu untuk AI: ").strip()
            if msg:
                print("\n⏳ Sedang berpikir...")
                payload = {
                    "model": "deepseek/deepseek-v4-pro",
                    "messages": [{"role": "user", "content": msg}],
                    "temperature": 0.7
                }
                req = urllib.request.Request(
                    f"{BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json", "User-Agent": USER_AGENT},
                    data=json.dumps(payload).encode("utf-8")
                )
                try:
                    with urllib.request.urlopen(req) as res:
                        data = json.loads(res.read().decode("utf-8"))
                        print(f"\n🤖 TokenGo AI:\n{data['choices'][0]['message']['content']}")
                except Exception as e:
                    print(f"❌ Error: {e}")
        elif choice == "3" or not choice:
            print("👋 Sampai jumpa, selamat berkarya!")
            break

if __name__ == "__main__":
    main()
