import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('makima', {
    chat:   (messages: { role: string; content: string }[]) => ipcRenderer.invoke('ollama:chat', messages),
    health: ()                                               => ipcRenderer.invoke('ollama:health'),
});
