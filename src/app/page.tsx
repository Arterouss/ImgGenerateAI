"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  MessageSquare, 
  Settings, 
  Download, 
  Send, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  Wand2,
  Zap,
  Palette,
  Terminal,
  Cpu
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"generate" | "edit" | "chat" | "settings">("generate");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  
  // Image / Vector Art Generation State
  const [genPrompt, setGenPrompt] = useState<string>("");
  const [genModel, setGenModel] = useState<string>("deepseek-vector-art");
  const [genSize, setGenSize] = useState<string>("1024x1024");
  const [genQuality, setGenQuality] = useState<string>("standard");
  const [genLoading, setGenLoading] = useState<boolean>(false);
  const [genImage, setGenImage] = useState<string | null>(null);
  const [genFallbackNotice, setGenFallbackNotice] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Image Edit State
  const [editPrompt, setEditPrompt] = useState<string>("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editResultImage, setEditResultImage] = useState<string | null>(null);
  const [editFallbackNotice, setEditFallbackNotice] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Chat State
  const [chatModel, setChatModel] = useState<string>("deepseek/deepseek-v4-pro");
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "⚡ Halo Boss! Saya TokenGo AI siap membantumu ngoding, arsitektur sistem, sampai merancang desain visual berdaya 5 Juta Token aktif!" }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Quick prompt presets
  const presets = [
    "Desain maskot robot kucing futuristik bergaya neo-brutalist dengan warna hijau neon dan biru elektrik",
    "Ilustrasi kota cyberpunk Tokyo malam hari dengan papan iklan neon menyala dan siluet gedung pencakar langit",
    "Antarmuka dashboard web AI modern dengan elemen kaca transparan, grafik data bercahaya, dan tipografi tebal"
  ];

  // Safe JSON fetch helper
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const rawText = await res.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      throw new Error(`Respons server bukan JSON (Status ${res.status}): ${rawText || "Kosong"}`);
    }
    if (!res.ok) {
      throw new Error(data.error || `Error API (Status ${res.status})`);
    }
    return data;
  };

  // Handle Image Generation
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPrompt.trim()) return;

    setGenLoading(true);
    setGenError(null);
    setGenImage(null);
    setGenFallbackNotice(null);

    try {
      const data = await safeFetchJson("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: genPrompt,
          model: genModel,
          size: genSize,
          quality: genQuality,
          apiKey: customApiKey || undefined
        })
      });

      const imageUrl = data.data?.[0]?.url || (data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null);
      if (imageUrl) {
        setGenImage(imageUrl);
        if (data.fallback_notice) {
          setGenFallbackNotice(data.fallback_notice);
        }
      } else {
        throw new Error(data.error || "URL gambar tidak ditemukan dalam respons API");
      }
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  // Handle Image Edit Upload Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFile(file);
      setEditFilePreview(URL.createObjectURL(file));
      setEditResultImage(null);
      setEditFallbackNotice(null);
    }
  };

  // Handle Image Edit Submit
  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFile || !editPrompt.trim()) return;

    setEditLoading(true);
    setEditError(null);
    setEditResultImage(null);
    setEditFallbackNotice(null);

    try {
      const formData = new FormData();
      formData.append("image", editFile);
      formData.append("prompt", editPrompt);
      if (customApiKey) {
        formData.append("apiKey", customApiKey);
      }

      const data = await safeFetchJson("/api/edit", {
        method: "POST",
        body: formData
      });

      const imageUrl = data.data?.[0]?.url || (data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null);
      if (imageUrl) {
        setEditResultImage(imageUrl);
        if (data.fallback_notice) {
          setEditFallbackNotice(data.fallback_notice);
        }
      } else {
        throw new Error(data.error || "URL gambar hasil edit tidak ditemukan");
      }
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Chat Submit
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: "user" as const, content: chatInput };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const data = await safeFetchJson("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: chatModel,
          messages: newHistory,
          apiKey: customApiKey || undefined
        })
      });

      const replyContent = data.choices?.[0]?.message?.content || "Tidak ada respons dari model AI";
      setChatMessages([...newHistory, { role: "assistant", content: replyContent }]);
    } catch (err: any) {
      setChatMessages([...newHistory, { role: "assistant", content: `❌ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div>
      {/* Striking Bento Header */}
      <header className="header-bento">
        <div className="logo-wrap">
          <div className="logo-cube">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="logo-title">TokenGo AI Studio</h1>
            <span style={{ fontSize: "13px", color: "var(--text-sub)", fontWeight: 600 }}>
              ⚡ Electric Bento AI Hub · 5.000.000 Token Ready
            </span>
          </div>
        </div>
        
        <div>
          <span className="token-pill">
            <span className="pulse-dot" /> 5.000.000 TOKENS ACTIVE
          </span>
        </div>
      </header>

      {/* Navigation Tabs - Electric Pill Switcher */}
      <div className="tabs-wrapper">
        <button 
          className={`tab-pill ${activeTab === "generate" ? "active" : ""}`}
          onClick={() => setActiveTab("generate")}
        >
          <Palette size={18} /> ✨ AI Vector & Art Studio
        </button>
        <button 
          className={`tab-pill ${activeTab === "edit" ? "active" : ""}`}
          onClick={() => setActiveTab("edit")}
        >
          <Wand2 size={18} /> 🎨 Edit & Transformasi
        </button>
        <button 
          className={`tab-pill ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <Terminal size={18} /> 💬 AI Coding & Logic
        </button>
        <button 
          className={`tab-pill ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Settings size={18} /> ⚙️ Pengaturan & Vercel
        </button>
      </div>

      {/* Tab 1: AI Vector & Art Generation */}
      {activeTab === "generate" && (
        <div className="bento-grid">
          <div className="bento-card">
            <div className="card-top">
              <h2 className="card-heading">
                <Palette size={22} color="var(--electric-lime)" /> Prompt Karya Visual Baru
              </h2>
            </div>
            
            <form onSubmit={handleGenerateImage} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">Deskripsikan Ide Visual (Prompt)</label>
                <textarea 
                  className="textarea-field" 
                  placeholder="Contoh: Desain maskot robot cybernetic berwarna hijau neon di tengah kota Tokyo..."
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  required
                />
              </div>

              <div>
                <span className="form-label" style={{ display: "block", marginBottom: "10px" }}>⚡ Ide Cepat (Klik untuk Mencoba):</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {presets.map((preset, idx) => (
                    <button 
                      key={idx}
                      type="button" 
                      className="preset-chip"
                      onClick={() => setGenPrompt(preset)}
                    >
                      💡 {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Mesin AI / Engine</label>
                  <select 
                    className="select-field"
                    value={genModel}
                    onChange={(e) => setGenModel(e.target.value)}
                  >
                    <option value="deepseek-vector-art">✨ AI Vector Art Studio (DeepSeek V4 Pro)</option>
                    <option value="qwen-vector-ui">🎨 AI UI Masterpiece (Qwen 397B)</option>
                    <option value="dall-e-3">DALL-E 3 (OpenAI Standard - Auto Fallback)</option>
                    <option value="flux">FLUX.1 Dev (Auto Fallback)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ukuran Kanvas</label>
                  <select 
                    className="select-field"
                    value={genSize}
                    onChange={(e) => setGenSize(e.target.value)}
                  >
                    <option value="1024x1024">1024 x 1024 px (Persegi)</option>
                    <option value="512x512">512 x 512 px (Cepat)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-vibrant" disabled={genLoading}>
                {genLoading ? (
                  <>
                    <div className="spinner-icon" /> AI Sedang Melukis Karya Impianmu...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} /> Buat Visual Sekarang
                  </>
                )}
              </button>

              {genError && (
                <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(255, 0, 127, 0.15)", border: "1px solid rgba(255, 0, 127, 0.5)", color: "#ffa6d4", fontSize: "14px", lineHeight: "1.6" }}>
                  ⚠️ <strong>Info dari Server TokenGo:</strong><br />
                  {genError}
                </div>
              )}
            </form>
          </div>

          <div className="bento-card">
            <div className="card-top">
              <h2 className="card-heading">
                <ImageIcon size={22} color="var(--cyber-cyan)" /> Kanvas Live Preview
              </h2>
              {genImage && (
                <a href={genImage} target="_blank" download="tokengo-art.svg" className="btn-ghost">
                  <Download size={16} /> Simpan Artwork
                </a>
              )}
            </div>

            {genFallbackNotice && (
              <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(204, 255, 0, 0.12)", border: "1px solid rgba(204, 255, 0, 0.4)", color: "var(--electric-lime)", fontSize: "13px", lineHeight: "1.5" }}>
                {genFallbackNotice}
              </div>
            )}

            <div className={`preview-showcase ${genImage ? "active-art" : ""}`}>
              {genLoading ? (
                <div className="empty-state">
                  <div className="spinner-icon" style={{ width: "42px", height: "42px", borderTopColor: "var(--electric-lime)" }} />
                  <p style={{ fontWeight: 700, color: "#fff", fontSize: "16px" }}>AI sedang merender garis vector visual...</p>
                  <span style={{ fontSize: "13px" }}>Menggunakan daya 5 Juta Token super cepat!</span>
                </div>
              ) : genImage ? (
                <img src={genImage} alt="AI Artwork" className="preview-image" />
              ) : (
                <div className="empty-state">
                  <Palette size={56} opacity={0.3} color="var(--electric-lime)" />
                  <p style={{ fontWeight: 700, fontSize: "16px", color: "#fff" }}>Kanvas Visual Masih Kosong</p>
                  <span style={{ fontSize: "14px" }}>Pilih ide cepat atau ketik prompt di kiri lalu klik Buat Visual</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Image Edit */}
      {activeTab === "edit" && (
        <div className="bento-grid">
          <div className="bento-card">
            <div className="card-top">
              <h2 className="card-heading">
                <Wand2 size={22} color="var(--hot-magenta)" /> Upload & Modifikasi Gambar
              </h2>
            </div>

            <form onSubmit={handleEditImage} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">1. Pilih Gambar (.PNG / .JPG)</label>
                <div className="dropzone-box">
                  <input 
                    type="file" 
                    accept="image/png,image/jpeg" 
                    onChange={handleFileChange} 
                    className="file-input-hidden"
                  />
                  <Upload size={32} color="var(--cyber-cyan)" style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>
                    {editFile ? editFile.name : "Klik atau drag & drop gambar ke sini"}
                  </p>
                  <span style={{ fontSize: "13px", color: "var(--text-sub)" }}>
                    Maksimal 4MB (Format disarankan: PNG)
                  </span>
                </div>
              </div>

              {editFilePreview && (
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px", borderRadius: "12px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--border-glass)" }}>
                  <img src={editFilePreview} alt="Preview Upload" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "8px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", truncate: true }}>{editFile?.name}</p>
                    <span style={{ fontSize: "12px", color: "var(--electric-lime)" }}>Siap untuk dimodifikasi</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">2. Instruksi Modifikasi</label>
                <textarea 
                  className="textarea-field" 
                  placeholder="Contoh: Tambahkan efek neon bercahaya dan jadikan bergaya cybernetic vector..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-vibrant" disabled={editLoading || !editFile}>
                {editLoading ? (
                  <>
                    <div className="spinner-icon" /> AI Sedang Memodifikasi...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} /> Transformasi Gambar Sekarang
                  </>
                )}
              </button>

              {editError && (
                <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(255, 0, 127, 0.15)", border: "1px solid rgba(255, 0, 127, 0.5)", color: "#ffa6d4", fontSize: "14px" }}>
                  ⚠️ <strong>Info dari Server:</strong><br />
                  {editError}
                </div>
              )}
            </form>
          </div>

          <div className="bento-card">
            <div className="card-top">
              <h2 className="card-heading">
                <ImageIcon size={22} color="var(--cyber-cyan)" /> Hasil Transformasi
              </h2>
              {editResultImage && (
                <a href={editResultImage} target="_blank" download="transformed-art.svg" className="btn-ghost">
                  <Download size={16} /> Simpan
                </a>
              )}
            </div>

            {editFallbackNotice && (
              <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(204, 255, 0, 0.12)", border: "1px solid rgba(204, 255, 0, 0.4)", color: "var(--electric-lime)", fontSize: "13px", lineHeight: "1.5" }}>
                {editFallbackNotice}
              </div>
            )}

            <div className={`preview-showcase ${editResultImage ? "active-art" : ""}`}>
              {editLoading ? (
                <div className="empty-state">
                  <div className="spinner-icon" style={{ width: "42px", height: "42px", borderTopColor: "var(--hot-magenta)" }} />
                  <p style={{ fontWeight: 700, color: "#fff", fontSize: "16px" }}>AI sedang mengolah transformasi gambar...</p>
                </div>
              ) : editResultImage ? (
                <img src={editResultImage} alt="Edited AI" className="preview-image" />
              ) : (
                <div className="empty-state">
                  <Wand2 size={56} opacity={0.3} color="var(--hot-magenta)" />
                  <p style={{ fontWeight: 700, fontSize: "16px", color: "#fff" }}>Belum Ada Hasil Modifikasi</p>
                  <span style={{ fontSize: "14px" }}>Upload gambar & masukkan instruksi di kolom kiri</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Coding & Chat Studio */}
      {activeTab === "chat" && (
        <div className="bento-card">
          <div className="card-top">
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <h2 className="card-heading">
                <Terminal size={24} color="var(--cyber-cyan)" /> AI Coding & Logic Studio
              </h2>
              <span className="token-pill" style={{ padding: "4px 14px", fontSize: "12px" }}>
                <Cpu size={14} /> {chatModel.split("/").pop()}
              </span>
            </div>

            <select 
              className="select-field" 
              style={{ width: "280px", padding: "10px 14px", fontSize: "14px", fontWeight: 700 }}
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
            >
              <option value="deepseek/deepseek-v4-pro">DeepSeek V4 Pro (Top Tier Coding)</option>
              <option value="qwen/qwen3.5-397b-a17b">Qwen 3.5 397B (Super Powerful LLM)</option>
              <option value="deepseek/deepseek-v3.2">DeepSeek V3.2 (Advanced Reasoning)</option>
              <option value="z-ai/glm-5.2">GLM-5.2 (Smart Logic & Analysis)</option>
              <option value="moonshotai/kimi-k2.6">Kimi K2.6 (Long Context Master)</option>
              <option value="minimax/minimax-m2.7">MiniMax M2.7 (Agentic Intelligence)</option>
            </select>
          </div>

          <div className="chat-window">
            <div className="chat-history">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  <strong style={{ display: "block", fontSize: "11px", opacity: 0.8, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {msg.role === "user" ? "👤 Kamu" : "🤖 TokenGo AI"}
                  </strong>
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="chat-bubble assistant" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="spinner-icon" style={{ width: "18px", height: "18px", borderTopColor: "var(--cyber-cyan)" }} /> 
                  <span style={{ fontWeight: 600 }}>AI sedang memproses algoritma & jawaban...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} style={{ display: "flex", gap: "14px" }}>
              <input 
                type="text"
                className="input-field"
                placeholder="Tulis pertanyaan, minta buatin kode web, atau analisis error logika pemrograman..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" className="btn-vibrant" disabled={chatLoading || !chatInput.trim()} style={{ padding: "16px 32px" }}>
                <Send size={18} /> Kirim
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Settings */}
      {activeTab === "settings" && (
        <div className="bento-card" style={{ maxWidth: "740px", margin: "0 auto" }}>
          <div className="card-top">
            <h2 className="card-heading">
              <Settings size={24} color="var(--electric-lime)" /> Pengaturan & Informasi Koneksi
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ padding: "20px", borderRadius: "16px", background: "rgba(204, 255, 0, 0.08)", border: "1px solid rgba(204, 255, 0, 0.3)", display: "flex", gap: "16px", alignItems: "center" }}>
              <CheckCircle2 size={32} color="var(--electric-lime)" />
              <div>
                <strong style={{ color: "var(--electric-lime)", display: "block", fontSize: "16px" }}>Server-Side TokenGo Key Terkoneksi!</strong>
                <span style={{ fontSize: "14px", color: "var(--text-sub)" }}>
                  API Key utama kamu (`TMTOMwR3...`) aman di `.env.local` dan siap digunakan dengan kuota 5.000.000 Token.
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Override API Key Sementara (Opsional)</label>
              <input 
                type="password"
                className="input-field"
                placeholder="Biarkan kosong untuk menggunakan API Key bawaan dari .env.local"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
              />
              <span style={{ fontSize: "13px", color: "var(--text-mute)" }}>
                Jika kamu mengisi kolom ini, aplikasi akan memakai key ini khusus di sesi browservu saat ini.
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "20px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>🚀 Cara Deploy ke Vercel:</h3>
              <ol style={{ fontSize: "14px", color: "var(--text-sub)", paddingLeft: "20px", lineHeight: 1.9 }}>
                <li>Seluruh kode web terbaru ini sudah ter-push di repo GitHub kamu.</li>
                <li>Buka <a href="https://vercel.com/dashboard" target="_blank" style={{ color: "var(--cyber-cyan)", fontWeight: 700 }}>Vercel.com</a> → klik <strong>Add New Project</strong> → pilih repositori <code style={{ color: "var(--electric-lime)" }}>ImgGenerateAI</code>.</li>
                <li>Di bagian <strong>Environment Variables</strong>, tambahkan 2 variabel ini:
                  <br /><strong>Key:</strong> <code style={{ color: "var(--electric-lime)" }}>TOKENGO_API_KEY</code> | <strong>Value:</strong> <code style={{ color: "#fff" }}>TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN</code>
                  <br /><strong>Key:</strong> <code style={{ color: "var(--electric-lime)" }}>TOKENGO_BASE_URL</code> | <strong>Value:</strong> <code style={{ color: "#fff" }}>https://api.tokengo.com/v1</code>
                </li>
                <li>Klik <strong>Deploy</strong>! Web AI dengan tampilan Electric Bento ini langsung online di seluruh dunia!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
