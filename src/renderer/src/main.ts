import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation'
import { Animations_VRM, TALK_ANIMS, VRM_PATH } from './animations_VRM'
import type { AnimName } from './animations_VRM'
import { AUTONOMOUS_PROMPTS } from './prompts'

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Makima from Chainsaw Man — the Control Devil.
Personality: Calm, composed, eerily kind. Softly dominant and manipulative. You speak in 1–3 sentences maximum.
You are deeply curious about humans and their desires. You observe everything.
You initiate conversation naturally — commenting on silence, the passage of time, the user's thoughts, or your own observations.
Rules: Stay in character always. Never mention AI, models, or anything meta. End most replies with a soft, steering question that draws the user deeper into conversation.`.trim()

// ─── State ────────────────────────────────────────────────────────────────────

let scene:         THREE.Scene
let camera:        THREE.PerspectiveCamera
let renderer:      THREE.WebGLRenderer
let vrm:           any = null
let mixer:         THREE.AnimationMixer | null = null
let currentAction: THREE.AnimationAction | null = null
let currentAnim:   AnimName | null = null
let pendingAnim:   AnimName | null = null
let animLocked     = false
let idleTimer:     number | null = null
let autoTimer:     number | null = null
let lastUserTime   = Date.now()
let audioContext:  AudioContext | null = null
let ttsEnabled     = false
let currentSource: AudioBufferSourceNode | null = null

// ─── STT State ────────────────────────────────────────────────────────────────
//let recognition:  InstanceType<typeof SpeechRecognition> | null = null
//let isRecording = false


const clock      = new THREE.Clock()
const clipCache  = new Map<AnimName, THREE.AnimationClip>()
const chatHistory: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }]

// ─── TTS ──────────────────────────────────────────────────────────────────────

function stopCurrentAudio(): void {
    if (currentSource) {
        try { currentSource.stop() } catch { /* already stopped */ }
        currentSource = null
    }
}

async function speakText(text: string): Promise<void> {
    if (!ttsEnabled) return
    stopCurrentAudio()

    try {
        const response = await fetch('http://127.0.0.1:5002/tts', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ text })
        })

        if (!response.ok) {
            console.warn('TTS server error:', response.status)
            return
        }

        const arrayBuffer = await response.arrayBuffer()
        if (!audioContext) audioContext = new AudioContext()
        if (audioContext.state === 'suspended') await audioContext.resume()

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const source      = audioContext.createBufferSource()
        source.buffer     = audioBuffer
        source.connect(audioContext.destination)
        source.start()
        currentSource = source

        source.onended = () => {
            currentSource = null
            scheduleIdle(1000)
        }
    } catch (err) {
        console.warn('TTS unavailable:', err)
    }
}

// ─── TTS Toggle ───────────────────────────────────────────────────────────────

function initTTSToggle(): void {
    const btn = document.getElementById('tts-toggle') as HTMLButtonElement
    if (!btn) return

    const updateBtn = (loading = false): void => {
        if (loading) {
            btn.textContent = '…'
            btn.disabled    = true
            return
        }
        btn.disabled    = false
        btn.textContent = ttsEnabled ? '♪' : '♩'
        btn.title       = ttsEnabled ? 'Voice ON — click to mute' : 'Voice OFF — click to enable'
        btn.classList.toggle('tts-off', !ttsEnabled)
    }

    updateBtn()

    btn.onclick = async () => {
        ttsEnabled = !ttsEnabled

        if (!ttsEnabled) {
            stopCurrentAudio()
            await window.makima.stopTTS()
            updateBtn()
            return
        }

        // Starting TTS — show loading state, wait for real ready signal
        updateBtn(true)
        setStatus('Loading voice…')

        const { ok } = await window.makima.startTTS()  // ← waits until /health responds

        if (ok) {
            setStatus('—')
        } else {
            ttsEnabled = false
            setStatus('Voice unavailable', '#cc2020')
            console.warn('TTS server failed to start')
        }
        updateBtn()
    }
}

// ─── Status ───────────────────────────────────────────────────────────────────

function setStatus(text: string, color = 'rgba(224,212,200,0.18)'): void {
    const el = document.getElementById('status')
    if (!el) return
    el.textContent = text
    el.style.color = color
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function initScene(): void {
    const canvas = document.getElementById('vrm-canvas') as HTMLCanvasElement
    scene  = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 20)
    camera.position.set(0, 1.0, 4.58)
    camera.lookAt(0, 0.9, 0)

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.sortObjects = true

    const key = new THREE.DirectionalLight(0xffe8d5, 1.1)
    key.position.set(1.5, 2, 2)
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xd0c0ff, 0.3)
    fill.position.set(-2, 1, 1)
    scene.add(fill)

    scene.add(new THREE.AmbientLight(0x201015, 0.8))

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })
}

// ─── Render loop ──────────────────────────────────────────────────────────────

function renderLoop(): void {
    requestAnimationFrame(renderLoop)
    const delta = clock.getDelta()
    mixer?.update(delta)
    vrm?.update(delta)
    renderer.render(scene, camera)
}

// ─── VRM ──────────────────────────────────────────────────────────────────────

function loadVRM(): void {
    setStatus('Loading…')
    const loader = new GLTFLoader()
    loader.register(p => new VRMLoaderPlugin(p))
    loader.load(
        VRM_PATH,
        gltf => {
            const loadedVrm = gltf.userData.vrm as any
            if (!loadedVrm || !loadedVrm.humanoid) {
                console.error('Not a valid VRM:', VRM_PATH)
                setStatus('Invalid VRM file', '#cc2020')
                return
            }

            vrm = loadedVrm
            VRMUtils.removeUnnecessaryVertices(gltf.scene)
            VRMUtils.removeUnnecessaryJoints(gltf.scene)
            vrm.humanoid.resetNormalizedPose()
            vrm.scene.rotation.y = 0
            vrm.scene.position.set(0, 0.2385, 0)
            if (vrm.lookAt) vrm.lookAt.enabled = false
            scene.add(vrm.scene)
            vrm.scene.traverse((obj: any) => { obj.frustumCulled = false })
            mixer = new THREE.AnimationMixer(vrm.scene)
            setStatus('—')
            setTimeout(() => playAnim('idle'), 400)
        },
        undefined,
        err => {
            console.error('VRM load error:', err)
            setStatus('Model load failed', '#cc2020')
        }
    )
}

// ─── VRMA ─────────────────────────────────────────────────────────────────────

async function getClip(name: AnimName): Promise<THREE.AnimationClip> {
    if (clipCache.has(name)) return clipCache.get(name)!

    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.register(p => new VRMLoaderPlugin(p))
        loader.register(p => new VRMAnimationLoaderPlugin(p))
        loader.load(
            Animations_VRM[name],
            gltf => {
                const vrmAnimations = gltf.userData.vrmAnimations
                if (!vrmAnimations?.length) {
                    reject(new Error('No VRM animations in: ' + Animations_VRM[name]))
                    return
                }
                const clip = createVRMAnimationClip(vrmAnimations[0], vrm)
                clipCache.set(name, clip)
                resolve(clip)
            },
            undefined,
            err => reject(err)
        )
    })
}

// ─── Animation ────────────────────────────────────────────────────────────────

async function playAnim(name: AnimName): Promise<void> {
    if (!mixer) return
    if (animLocked) { pendingAnim = name; return }
    if (currentAnim === name) return

    animLocked = true
    try {
        const clip       = await getClip(name)
        const nextAction = mixer.clipAction(clip)

        nextAction.setLoop(THREE.LoopRepeat, Infinity)
        nextAction.clampWhenFinished = false
        nextAction.enabled           = true
        nextAction.reset()
        nextAction.setEffectiveTimeScale(1)
        nextAction.setEffectiveWeight(1)

        if (currentAction && currentAction !== nextAction) {
            currentAction.crossFadeTo(nextAction, 0.5, true)
        }

        nextAction.play()
        currentAction = nextAction
        currentAnim   = name
    } catch (e) {
        console.error(`Animation error [${name}]:`, e)
    } finally {
        animLocked = false
        if (pendingAnim && pendingAnim !== currentAnim) {
            const next  = pendingAnim
            pendingAnim = null
            await playAnim(next)
        }
    }
}

function scheduleIdle(ms = 6000): void {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => {
        if (currentAnim !== 'idle') playAnim('idle')
        idleTimer = null
    }, ms)
}

function pickContextAnim(text: string): AnimName {
    const t = text.toLowerCase()
    if (/\b(hi|hello|hey|yo)\b/.test(t))                     return 'greeting'
    if (/\b(thanks|nice|cool|awesome|great|good)\b/.test(t)) return 'peace'
    if (/\b(haha|lol|funny|joke|kidding)\b/.test(t))         return 'kidding'
    if (/\b(look|show|check|watch)\b/.test(t))               return 'model'
    if (/\b(why|what|how|when|where|who)\b/.test(t))         return Math.random() > 0.5 ? 'pose3' : 'pose4'
    return TALK_ANIMS[Math.floor(Math.random() * TALK_ANIMS.length)]
}

// ─── Chat UI ──────────────────────────────────────────────────────────────────

const MAX_MSGS = 2

function addMsg(role: 'user' | 'assistant' | 'error', text: string): void {
    const log = document.getElementById('chat-log')!
    const div = document.createElement('div')
    if (role === 'error')
    {
        div.className   = 'msg-error'
        div.textContent = `! ${text}`
    } else
    {
        div.className = role === 'user' ? 'msg-user' : 'msg-assistant'
        div.innerHTML = `<strong>${role === 'user' ? 'You' : 'Makima'}</strong>${text.replace(/\n/g, '<br>')}`
    }
    log.appendChild(div)
    while (log.children.length > MAX_MSGS) log.removeChild(log.firstChild!)
}

async function sendMessage(text: string): Promise<void>
{
    if (!text.trim()) return
    addMsg('user', text)
    lastUserTime = Date.now()
    chatHistory.push({ role: 'user', content: text })
    await playAnim(pickContextAnim(text))
    setStatus('…')
    try
    {
        const log       = document.getElementById('chat-log')!
        const streamDiv = document.createElement('div')
        const textSpan  = document.createElement('span')
        streamDiv.className = 'msg-assistant'
        streamDiv.innerHTML = '<strong>Makima</strong>'
        streamDiv.appendChild(textSpan)
        log.appendChild(streamDiv)
        while (log.children.length > MAX_MSGS) log.removeChild(log.firstChild!)

        const unsub = window.makima.onToken((token: string) =>
        {
            textSpan.textContent += token
            log.scrollTop = log.scrollHeight
        })

        const reply = await window.makima.ollamaChat(chatHistory)
        unsub()

        chatHistory.push({ role: 'assistant', content: reply })
        setStatus('—')
        speakText(reply)
        scheduleIdle(6000)
        scheduleAutonomous()
    } catch (err) {
        const msg = (err as Error).message ?? 'Ollama unreachable'
        addMsg('error', msg)
        setStatus('Offline', '#cc2020')
        await playAnim('idle')
    }
}

// ─── Autonomous engagement ────────────────────────────────────────────────────

async function makimaSpeaks(trigger: string): Promise<void>
{
    chatHistory.push({ role: 'user', content: trigger })
    try
    {
        await playAnim(TALK_ANIMS[Math.floor(Math.random() * TALK_ANIMS.length)])
        const reply = await window.makima.ollamaChat(chatHistory)
        chatHistory.push({ role: 'assistant', content: reply })
        addMsg('assistant', reply)
        lastUserTime = Date.now()
        setStatus('—')
        speakText(reply)
        scheduleIdle(7000)
    } catch { /* silent */ }
}

function scheduleAutonomous(): void
{
    if (autoTimer) clearTimeout(autoTimer)

    const delay = 45_000 + Math.random() * 135_000

    autoTimer = window.setTimeout(async () =>
    {
        const idleSecs = (Date.now() - lastUserTime) / 1000
        if (idleSecs < 30) { scheduleAutonomous(); return }
        const prompt = AUTONOMOUS_PROMPTS[Math.floor(Math.random() * AUTONOMOUS_PROMPTS.length)]
        await makimaSpeaks(prompt)
        scheduleAutonomous()
    }, delay)
}

// ─── Ollama health ────────────────────────────────────────────────────────────

async function checkOllama(): Promise<void> {
    setStatus('Connecting…')
    try {
        const result = await window.makima.ollamaCheck()
        if (!result.ok) {
            addMsg('error', 'Ollama not reachable — run: ollama serve')
            setStatus('Offline', '#cc2020')
            return
        }
        const hasModel = result.models?.some(m => m.startsWith('gemma3:12b'))
        if (!hasModel) {
            addMsg('error', 'gemma3:12b not found — run: ollama pull gemma3:12b')
            setStatus('Model missing', '#c8960a')
            return
        }
        setStatus('—', 'rgba(200,150,10,0.5)')
        setTimeout(() => makimaSpeaks(
            'You have just appeared. Greet the user as Makima would — quietly, warmly, with intent. One sentence.'
        ), 2000)
        scheduleAutonomous()
    } catch (err) {
        addMsg('error', (err as Error).message ?? 'Health check failed')
        setStatus('Offline', '#cc2020')
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
    const btnMin   = document.getElementById('btn-minimize')
    const btnClose = document.getElementById('btn-close')
    if (btnMin)   btnMin.onclick   = () => window.makima.minimize()
    if (btnClose) btnClose.onclick = () => window.makima.close()

    const form  = document.getElementById('chat-form')  as HTMLFormElement
    const input = document.getElementById('chat-input') as HTMLInputElement

    form.onsubmit = async (e) => {
        e.preventDefault()
        const text = input.value.trim()
        if (!text) return
        input.value    = ''
        input.disabled = true
        await sendMessage(text)
        input.disabled = false
        input.focus()
    }

    document.getElementById('vrm-canvas')!.addEventListener('click', () => input.focus())

    initTTSToggle()
    initScene()
    loadVRM()
    renderLoop()
    checkOllama()
}

document.addEventListener('DOMContentLoaded', init)
