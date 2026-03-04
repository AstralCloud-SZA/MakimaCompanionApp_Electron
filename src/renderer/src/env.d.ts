/// <reference types="vite/client" />

interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface Window {
    makima: {
        ollamaCheck: () => Promise<{ ok: boolean; models?: string[]; error?: string }>
        ollamaChat:  (messages: ChatMessage[]) => Promise<string>
    }
}
