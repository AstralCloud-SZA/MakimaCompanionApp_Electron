/// <reference types="vite/client" />

interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface Window {
    makima: {
        minimize:    () => void
        close:       () => void
        ollamaCheck: () => Promise<{ ok: boolean; models?: string[]; error?: string }>
        ollamaChat:  (messages: ChatMessage[]) => Promise<string>
    }
}
