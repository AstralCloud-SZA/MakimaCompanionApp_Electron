import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('makima', {
    ollamaCheck: (): Promise<{ ok: boolean; models?: string[]; error?: string }> =>
        ipcRenderer.invoke('ollama:health'),

    ollamaChat: (messages: { role: string; content: string }[]): Promise<string> =>
        ipcRenderer.invoke('ollama:chat', messages),
})
