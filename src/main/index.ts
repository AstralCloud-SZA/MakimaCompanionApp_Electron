import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';

const MODEL_NAME = 'gemma2:2b';
const OLLAMA_URL = 'http://localhost:11434/api/chat';

function createWindow(): void {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        transparent: true,
        frame: false,
        alwaysOnTop: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
        win.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ─── Ollama runs in Node.js here — zero CORS, zero CSP ────────────────────────

ipcMain.handle('ollama:chat', async (_e, messages: { role: string; content: string }[]) => {
    try {
        const res = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: MODEL_NAME, messages, stream: false }),
        });
        if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
        const data = await res.json() as any;
        return { ok: true, content: data.message?.content ?? '…' };
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    }
});

ipcMain.handle('ollama:health', async () => {
    try {
        const res = await fetch('http://localhost:11434/api/tags');
        const data = await res.json() as any;
        return { ok: true, models: (data.models ?? []).map((m: any) => m.name) };
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    }
});
