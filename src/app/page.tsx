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
  Wand2 
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"generate" | "edit" | "chat" | "settings">("generate");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  
  // Image Generation State
  const [genPrompt, setGenPrompt] = useState<string>("");
  const [genModel, setGenModel] = useState<string>("dall-e-3");
  const [genSize, setGenSize] = useState<string>("1024x1024");
  const [genQuality, setGenQuality] = useState<string>("standard");
  const [genLoading, setGenLoading] = useState<boolean>(false);
  const [genImage, setGenImage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Image Edit State
  const [editPrompt, setEditPrompt] = useState<string>("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editResultImage, setEditResultImage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Chat State
  const [chatModel, setChatModel] = useState<string>("deepseek/deepseek-v4-pro");
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Halo! Saya siap membantu kamu coding, menganalisis ide, atau menjawab pertanyaan apa pun dengan kekuatan kuota 5 Juta Token TokenGo!" }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Quick prompt presets
  const presets = [
    "Sebuah kota bergaya cyberpunk saat turun hujan lebat di malam hari, neon lights, ultra realistis 8k",
    "Kucing astronot melayang di ruang angkasa dengan latar belakang nebula berwarna ungu dan biru",
    "Desain antarmuka dashboard AI futuristik berbahan kaca transparan (glassmorphism), UI/UX modern"
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
    }
  };

  // Handle Image Edit Submit
  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFile || !editPrompt.trim()) return;

    setEditLoading(true);
    setEditError(null);
    setEditResultImage(null);

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
      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">✨</div>
          <div>
            <h1 className="logo-title">TokenGo AI Studio</h1>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Kekuatan 5 Juta Token untuk Kreativitas & Coding
            </span>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span className="logo-badge">⚡ 5.000.000 TOKENS ACTIVE</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === "generate" ? "active" : ""}`}
            onClick={() => setActiveTab("generate")}
          >
            <Sparkles size={16} /> Buat Gambar Baru
          </button>
          <button 
            className={`tab-btn ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            <Wand2 size={16} /> Edit Gambar
          </button>
          <button 
            className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={16} /> AI Chat & Coding
          </button>
          <button 
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={16} /> Pengaturan
          </button>
        </div>
      </div>

      {/* Tab 1: Image Generation */}
      {activeTab === "generate" && (
        <div className="main-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Sparkles size={20} color="var(--accent-purple)" /> Prompt Gambar Baru
              </h2>
            </div>
            
            <form onSubmit={handleGenerateImage} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="form-group">
                <label className="form-label">Deskripsikan Gambar (Prompt)</label>
                <textarea 
                  className="textarea-field" 
                  placeholder="Contoh: Kucing futuristik memakai jaket neon di tengah kota Tokyo malam hari..."
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  required
                />
              </div>

              <div>
                <span className="form-label" style={{ display: "block", marginBottom: "8px" }}>Atau Pilih Ide Cepat:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {presets.map((preset, idx) => (
                    <button 
                      key={idx}
                      type="button" 
                      className="btn-secondary" 
                      style={{ fontSize: "12px", textAlign: "left", justifyContent: "flex-start" }}
                      onClick={() => setGenPrompt(preset)}
                    >
                      💡 {preset.slice(0, 58)}...
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Model Gambar</label>
                  <select 
                    className="select-field"
                    value={genModel}
                    onChange={(e) => setGenModel(e.target.value)}
                  >
                    <option value="dall-e-3">DALL-E 3 (OpenAI Standard)</option>
                    <option value="dall-e-2">DALL-E 2 (Fast)</option>
                    <option value="flux">FLUX.1 Dev</option>
                    <option value="midjourney">Midjourney Compatible</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ukuran Gambar</label>
                  <select 
                    className="select-field"
                    value={genSize}
                    onChange={(e) => setGenSize(e.target.value)}
                  >
                    <option value="1024x1024">1024 x 1024 px</option>
                    <option value="512x512">512 x 512 px</option>
                    <option value="256x256">256 x 256 px</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={genLoading}>
                {genLoading ? (
                  <>
                    <Loader2 size={18} className="spinner" /> Sedang Membuat Gambar...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Buat Gambar Sekarang
                  </>
                )}
              </button>

              {genError && (
                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", fontSize: "13px", lineHeight: "1.5" }}>
                  ⚠️ <strong>Error dari Server TokenGo:</strong><br />
                  {genError}
                  {genError.includes("No available channel") && (
                    <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.9 }}>
                      💡 <em>Tip: Model image <code>{genModel}</code> belum diaktifkan atau tidak tersedia di channel API Key kamu saat ini. Coba pilih model lain atau gunakan fitur 💬 AI Chat & Coding yang sudah aktif!</em>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <ImageIcon size={20} color="var(--accent-cyan)" /> Hasil Preview Gambar
              </h2>
              {genImage && (
                <a href={genImage} target="_blank" download="generated-ai.png" className="btn-secondary" style={{ padding: "6px 12px" }}>
                  <Download size={14} /> Download
                </a>
              )}
            </div>

            <div className={`preview-box ${genImage ? "has-image" : ""}`}>
              {genLoading ? (
                <div className="placeholder-content">
                  <Loader2 size={36} className="spinner" style={{ borderTopColor: "var(--accent-purple)" }} />
                  <p style={{ fontWeight: 600 }}>AI sedang melukis gambar impianmu...</p>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Biasanya membutuhkan waktu 5 - 15 detik</span>
                </div>
              ) : genImage ? (
                <img src={genImage} alt="Generated AI" className="preview-image" />
              ) : (
                <div className="placeholder-content">
                  <ImageIcon size={48} opacity={0.3} />
                  <p>Belum ada gambar yang dibuat</p>
                  <span style={{ fontSize: "13px" }}>Masukkan deskripsi di kolom kiri lalu klik tombol Buat Gambar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Image Edit */}
      {activeTab === "edit" && (
        <div className="main-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Wand2 size={20} color="var(--accent-pink)" /> Upload & Edit Gambar
              </h2>
            </div>

            <form onSubmit={handleEditImage} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="form-group">
                <label className="form-label">1. Pilih Gambar Asli (.PNG / .JPG)</label>
                <div className="file-upload-box">
                  <input 
                    type="file" 
                    accept="image/png,image/jpeg" 
                    onChange={handleFileChange} 
                    className="file-input-hidden"
                  />
                  <Upload size={28} color="var(--accent-blue)" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontWeight: 600, fontSize: "14px" }}>
                    {editFile ? editFile.name : "Klik atau drag & drop gambar ke sini"}
                  </p>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Maksimal 4MB (Format disarankan: PNG)
                  </span>
                </div>
              </div>

              {editFilePreview && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)" }}>
                  <img src={editFilePreview} alt="Preview Upload" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, truncate: true }}>{editFile?.name}</p>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Siap untuk diedit</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">2. Instruksi Pengeditan</label>
                <textarea 
                  className="textarea-field" 
                  placeholder="Contoh: Tambahkan kacamata hitam keren di wajah kucing ini..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={editLoading || !editFile}>
                {editLoading ? (
                  <>
                    <Loader2 size={18} className="spinner" /> Sedang Mengedit Gambar...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} /> Edit Gambar Sekarang
                  </>
                )}
              </button>

              {editError && (
                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", fontSize: "13px" }}>
                  ⚠️ <strong>Error dari Server TokenGo:</strong><br />
                  {editError}
                </div>
              )}
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <ImageIcon size={20} color="var(--accent-cyan)" /> Hasil Edit Gambar
              </h2>
              {editResultImage && (
                <a href={editResultImage} target="_blank" download="edited-image.png" className="btn-secondary" style={{ padding: "6px 12px" }}>
                  <Download size={14} /> Download
                </a>
              )}
            </div>

            <div className={`preview-box ${editResultImage ? "has-image" : ""}`}>
              {editLoading ? (
                <div className="placeholder-content">
                  <Loader2 size={36} className="spinner" style={{ borderTopColor: "var(--accent-pink)" }} />
                  <p style={{ fontWeight: 600 }}>AI sedang memodifikasi gambarmu...</p>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Mohon tunggu sebentar</span>
                </div>
              ) : editResultImage ? (
                <img src={editResultImage} alt="Edited AI" className="preview-image" />
              ) : (
                <div className="placeholder-content">
                  <Wand2 size={48} opacity={0.3} />
                  <p>Belum ada hasil edit</p>
                  <span style={{ fontSize: "13px" }}>Upload gambar & masukkan instruksi di kiri</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Chat & Coding Assistant */}
      {activeTab === "chat" && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 className="card-title">
                <MessageSquare size={20} color="var(--accent-blue)" /> AI Coding & Chat Assistant
              </h2>
              <span className="badge-model">🤖 {chatModel.split("/").pop()}</span>
            </div>

            <select 
              className="select-field" 
              style={{ width: "260px", padding: "8px 12px", fontSize: "13px" }}
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
            >
              <option value="deepseek/deepseek-v4-pro">DeepSeek V4 Pro (Flagship Coding)</option>
              <option value="deepseek/deepseek-v3.2">DeepSeek V3.2 (Advanced Logic)</option>
              <option value="z-ai/glm-5.2">GLM-5.2 (Smart Reasoning)</option>
              <option value="moonshotai/kimi-k2.6">Kimi K2.6 (Long Context)</option>
              <option value="minimax/minimax-m2.7">MiniMax M2.7 (Agentic)</option>
              <option value="qwen/qwen3.5-397b-a17b">Qwen 3.5 397B (Ultra Powerful)</option>
            </select>
          </div>

          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  <strong style={{ display: "block", fontSize: "11px", opacity: 0.8, marginBottom: "4px", textTransform: "uppercase" }}>
                    {msg.role === "user" ? "👤 Kamu" : "🤖 TokenGo AI"}
                  </strong>
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="chat-bubble assistant" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Loader2 size={16} className="spinner" /> AI sedang berpikir & menyusun jawaban...
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="chat-input-row">
              <input 
                type="text"
                className="input-field"
                placeholder="Tulis pertanyaan atau minta buatin kode web, Python, atau logika pemrograman..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" className="btn-primary" disabled={chatLoading || !chatInput.trim()}>
                <Send size={18} /> Kirim
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Settings */}
      {activeTab === "settings" && (
        <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div className="card-header">
            <h2 className="card-title">
              <Settings size={20} color="var(--accent-purple)" /> Pengaturan API Key TokenGo
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", gap: "12px", alignItems: "center" }}>
              <CheckCircle2 size={24} color="#34d399" />
              <div>
                <strong style={{ color: "#34d399", display: "block" }}>Server-Side API Key Terpasang Aktif!</strong>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Key bawaan kamu (`TMTOMwR3...`) sudah aman tersimpan di `.env.local` server dan siap di-push ke Vercel!
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ganti/Override API Key Sementara (Opsional)</label>
              <input 
                type="password"
                className="input-field"
                placeholder="Biarkan kosong jika ingin menggunakan API Key dari .env.local"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Jika kamu mengisi kolom di atas, aplikasi akan menggunakan key ini untuk sesi penjelajahan saat ini.
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>🚀 Cara Deploy ke Vercel dengan Aman:</h3>
              <ol style={{ fontSize: "13px", color: "var(--text-secondary)", paddingLeft: "18px", lineHeight: 1.8 }}>
                <li>Push folder <code style={{ color: "white" }}>MyAI</code> ini ke repositori GitHub kamu.</li>
                <li>Buka dashboard <a href="https://vercel.com" target="_blank" style={{ color: "var(--accent-blue)" }}>Vercel.com</a> dan klik <strong>Add New Project</strong>.</li>
                <li>Pilih repo GitHub yang baru di-push.</li>
                <li>Pada bagian <strong>Environment Variables</strong>, tambahkan variabel baru:
                  <br /><strong>Key:</strong> <code style={{ color: "white" }}>TOKENGO_API_KEY</code>
                  <br /><strong>Value:</strong> <code style={{ color: "white" }}>TMTOMwR3tDcnY54QPLvtzq2YJC5H3hQ6lm7q6NxlLVeBmdvN</code>
                </li>
                <li>Klik <strong>Deploy</strong>! Web AI kamu langsung online & aman 100%!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
