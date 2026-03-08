import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const MODEL_NAME = 'gemma3:12b'
const OLLAMA_URL = 'http://localhost:11434/api/chat'

function createWindow(): void
{
    const win = new BrowserWindow({
        width:       900,
        height:      700,
        minWidth:    600,
        minHeight:   500,
        frame:       false,
        transparent: true,
        hasShadow:   true,
        icon:        join(__dirname, '../../build/icon2.ico'),
        webPreferences: {
            preload:          join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration:  false,
            webSecurity:      false,
            sandbox:          false,
        },
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL'])
    {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        win.webContents.openDevTools({ mode: 'detach' })
    } else
    {
        win.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() =>
{
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () =>
{
    if (process.platform !== 'darwin') app.quit()
})

// ─── Window controls ──────────────────────────────────────────────────────────

ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.on('window:close',    () => BrowserWindow.getFocusedWindow()?.close())

// ─── Ollama chat (streaming) ──────────────────────────────────────────────────

ipcMain.handle('ollama:chat', async (_e, messages: { role: string; content: string }[]) =>
{
    const win = BrowserWindow.getFocusedWindow()
    const res = await fetch(OLLAMA_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model: MODEL_NAME, messages, stream: true }),
    })
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)

    let fullContent = ''
    const reader    = res.body!.getReader()
    const decoder   = new TextDecoder()

    while (true)
    {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n').filter(Boolean))
        {
            try {
                const token = (JSON.parse(line).message?.content ?? '') as string
                fullContent += token
                win?.webContents.send('ollama:token', token)
            } catch { /* malformed chunk — skip */ }
        }
    }

    return fullContent
})

// ─── Ollama health check ──────────────────────────────────────────────────────

ipcMain.handle('ollama:health', async () =>
{
    try {
        const res  = await fetch('http://localhost:11434/api/tags')
        const data = await res.json() as any
        return { ok: true, models: (data.models ?? []).map((m: any) => m.name as string) }
    } catch (err) {
        return { ok: false, error: (err as Error).message }
    }
})
