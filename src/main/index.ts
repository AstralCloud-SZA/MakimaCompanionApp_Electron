import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const MODEL_NAME = 'gemma2:2b'
const OLLAMA_URL = 'http://localhost:11434/api/chat'

function createWindow(): void {
    const win = new BrowserWindow({
        width:       900,
        height:      700,
        minWidth:    600,
        minHeight:   500,
        frame:       false,
        transparent: true,
        hasShadow:   true,
        webPreferences: {
            preload:          join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration:  false,
            webSecurity:      false,   // ← lets THREE.js blob: textures load freely
            sandbox:          false,   // ← required for blob object URLs
        },
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        win.webContents.openDevTools({ mode: 'detach' })
    } else {
        win.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.on('window:close',    () => BrowserWindow.getFocusedWindow()?.close())

ipcMain.handle('ollama:chat', async (_e, messages: { role: string; content: string }[]) => {
    const res = await fetch(OLLAMA_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model: MODEL_NAME, messages, stream: false }),
    })
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
    const data = await res.json() as any
    return data.message?.content ?? '…'
})

ipcMain.handle('ollama:health', async () => {
    try {
        const res  = await fetch('http://localhost:11434/api/tags')
        const data = await res.json() as any
        return { ok: true, models: (data.models ?? []).map((m: any) => m.name as string) }
    } catch (err) {
        return { ok: false, error: (err as Error).message }
    }
})
