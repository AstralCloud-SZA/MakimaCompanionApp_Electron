import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'

const MODEL_NAME = 'gemma3:12b'
const OLLAMA_URL = 'http://localhost:11434/api/chat'
const TTS_URL    = 'http://127.0.0.1:5002/tts'

// ─── TTS Server process ───────────────────────────────────────────────────────

let ttsProcess: ChildProcess | null = null

function getSidecarPath(): string {
    if (is.dev) {
        return join(__dirname, '../../src/sidecar')
    }
    return join(process.resourcesPath, 'sidecar')
}

function getPythonPath(): string {
    const sidecar = getSidecarPath()
    const venvPython = join(sidecar, 'venv', 'Scripts', 'python.exe')
    return existsSync(venvPython) ? venvPython : 'python'
}

function startTTSServer(): void {
    const sidecarPath = getSidecarPath()
    const pythonPath  = getPythonPath()
    const serverScript = join(sidecarPath, 'tts_server.py')

    if (!existsSync(serverScript)) {
        console.error('TTS server script not found:', serverScript)
        return
    }

    console.log('Starting TTS server...')
    console.log('Python:', pythonPath)
    console.log('Script:', serverScript)

    ttsProcess = spawn(pythonPath, [serverScript], {
        cwd:   sidecarPath,
        stdio: 'pipe',
        env:   { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })

    ttsProcess.stdout?.on('data', (data) => {
        console.log('[TTS]', data.toString().trim())
    })

    ttsProcess.stderr?.on('data', (data) => {
        console.warn('[TTS ERR]', data.toString().trim())
    })

    ttsProcess.on('exit', (code) => {
        console.log('[TTS] Server exited with code:', code)
        ttsProcess = null
    })
}

function stopTTSServer(): void {
    if (ttsProcess) {
        console.log('Stopping TTS server...')
        ttsProcess.kill()
        ttsProcess = null
    }
}

// ─── Wait for TTS server to be ready ─────────────────────────────────────────

async function waitForTTS(retries = 15, delayMs = 1000): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:5002/health`)
            if (res.ok) {
                console.log('✅ TTS server ready')
                return true
            }
        } catch {
            console.log(`Waiting for TTS server... (${i + 1}/${retries})`)
            await new Promise(r => setTimeout(r, delayMs))
        }
    }
    console.warn('TTS server did not start in time — continuing without TTS')
    return false
}

// ─── Ollama process ───────────────────────────────────────────────────────────

let ollamaProcess: ChildProcess | null = null

function startOllama(): void {
    // Check if Ollama is already running
    fetch('http://localhost:11434/api/tags')
        .then(() => console.log('Ollama already running'))
        .catch(() => {
            console.log('Starting Ollama...')
            ollamaProcess = spawn('ollama', ['serve'], {
                stdio: 'pipe',
                shell: true,
                env: { ...process.env }
            })

            ollamaProcess.stdout?.on('data', (data) => {
                console.log('[Ollama]', data.toString().trim())
            })

            ollamaProcess.stderr?.on('data', (data) => {
                console.log('[Ollama]', data.toString().trim())
            })

            ollamaProcess.on('exit', (code) => {
                console.log('[Ollama] exited with code:', code)
                ollamaProcess = null
            })
        })
}

function stopOllama(): void {
    if (ollamaProcess) {
        console.log('Stopping Ollama...')
        ollamaProcess.kill()
        ollamaProcess = null
    }
}

async function waitForOllama(retries = 20, delayMs = 1000): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch('http://localhost:11434/api/tags')
            if (res.ok) {
                console.log('Ollama ready')
                return true
            }
        } catch {
            console.log(`Waiting for Ollama... (${i + 1}/${retries})`)
            await new Promise(r => setTimeout(r, delayMs))
        }
    }
    console.warn('Ollama did not start in time')
    return false
}


// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow(): void {
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

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        win.webContents.openDevTools({ mode: 'detach' })
    } else {
        win.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
    startOllama()
    startTTSServer()

    // Wait for both in parallel
    await Promise.all([
        waitForOllama(),
        waitForTTS()
    ])

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    stopTTSServer()
    stopOllama()
    if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
    stopTTSServer()
    stopOllama()
})

// ─── Window controls ──────────────────────────────────────────────────────────

ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.on('window:close',    () => {
    stopTTSServer()
    BrowserWindow.getFocusedWindow()?.close()
})

// ─── Ollama chat (streaming) ──────────────────────────────────────────────────

ipcMain.handle('ollama:chat', async (_e, messages: { role: string; content: string }[]) => {
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

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n').filter(Boolean)) {
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

ipcMain.handle('ollama:health', async () => {
    try {
        const res  = await fetch('http://localhost:11434/api/tags')
        const data = await res.json() as any
        return { ok: true, models: (data.models ?? []).map((m: any) => m.name as string) }
    } catch (err) {
        return { ok: false, error: (err as Error).message }
    }
})

// ─── TTS health check ────────────────────────────────────────────────────────

ipcMain.handle('tts:health', async () => {
    try {
        const res = await fetch('http://127.0.0.1:5002/health')
        return { ok: res.ok }
    } catch {
        return { ok: false }
    }
})
