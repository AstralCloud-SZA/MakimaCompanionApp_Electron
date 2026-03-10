/// <reference types="vite/client" />

interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

// src/renderer/env.d.ts  (fixed)
interface Window {
    makima: {
        minimize:    () => void
        close:       () => void
        getResourcesPath: () => string
        ollamaCheck: () => Promise<{ ok: boolean; models?: string[]; error?: string }>
        ollamaChat:  (messages: ChatMessage[]) => Promise<string>
        onToken:     (cb: (token: string) => void) => (() => void)
        // ─── TTS ──────────────────────────────────────────────────────
        startTTS:    () => Promise<{ ok: boolean }>
        stopTTS:     () => Promise<{ ok: boolean }>
        ttsHealth:   () => Promise<{ ok: boolean }>
    }
}
