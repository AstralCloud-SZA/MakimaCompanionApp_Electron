import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
    },
    renderer: {
        publicDir: resolve('resources'),
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
            },
        },
    },
})
