import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
    // ─── Main process ─────────────────────────────────────────────────────────
    main: {
        plugins: [externalizeDepsPlugin()],
    },

    // ─── Preload ──────────────────────────────────────────────────────────────
    preload: {
        plugins: [externalizeDepsPlugin()],
    },

    // ─── Renderer ─────────────────────────────────────────────────────────────
    renderer: {
        // Serves resources/ folder as root in dev
        // → ./models/makimaModel.vrm works without any path changes
        publicDir: resolve('resources'),

        server: {
            fs: {
                // Allow Vite to serve files from the project root (resources/)
                allow: [resolve('.')]
            }
        },

        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
            },
        },

        build: {
            // Raise the chunk size warning threshold (Three.js + VRM are large)
            chunkSizeWarningLimit: 4000,

            rollupOptions: {
                output: {
                    // Split Three.js and VRM into their own chunks
                    // so the main bundle stays lean
                    manualChunks: {
                        three: ['three'],
                        vrm:   ['@pixiv/three-vrm', '@pixiv/three-vrm-animation'],
                    }
                }
            }
        },

        optimizeDeps: {
            include: [
                'three',
                '@pixiv/three-vrm',
                '@pixiv/three-vrm-animation',
            ]
        }
    },
})
