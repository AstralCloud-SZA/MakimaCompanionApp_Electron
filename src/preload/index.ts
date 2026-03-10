import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('makima', {
    // ─── Window controls ──────────────────────────────────────────────────
    minimize: () => ipcRenderer.send('window:minimize'),
    close:    () => ipcRenderer.send('window:close'),

    // ─── Ollama ───────────────────────────────────────────────────────────
    ollamaCheck: (): Promise<{ ok: boolean; models?: string[]; error?: string }> =>
        ipcRenderer.invoke('ollama:health'),

    ollamaChat: (messages: { role: string; content: string }[]): Promise<string> =>
        ipcRenderer.invoke('ollama:chat', messages),

    onToken: (cb: (token: string) => void): (() => void) => {
        const handler = (_e: Electron.IpcRendererEvent, token: string) => cb(token)
        ipcRenderer.on('ollama:token', handler)
        return () => ipcRenderer.removeListener('ollama:token', handler)
    },

    // ─── TTS ──────────────────────────────────────────────────────────────
    startTTS: (): Promise<{ ok: boolean }> =>
        ipcRenderer.invoke('tts:start'),

    stopTTS: (): Promise<{ ok: boolean }> =>
        ipcRenderer.invoke('tts:stop'),

    ttsHealth: (): Promise<{ ok: boolean }> =>
        ipcRenderer.invoke('tts:health'),
})
