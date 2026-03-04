import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

// AnimName derives from ANIMATIONS — defined here since ANIMATIONS lives here
type AnimName = keyof typeof ANIMATIONS

// ─── Config ───────────────────────────────────────────────────────────────────

const VRM_PATH = './models/8559372518173948307.vrm'

const ANIMATIONS = {
    idle:     './models/animations/V_HIMEHINA.vrma',
    standing: './models/animations/VRMA_01.vrma',
    greeting: './models/animations/VRMA_02.vrma',
    peace:    './models/animations/VRMA_03.vrma',
    shoot:    './models/animations/VRMA_04.vrma',
    spin:     './models/animations/VRMA_05.vrma',
    model:    './models/animations/VRMA_06.vrma',
    squat:    './models/animations/VRMA_07.vrma',
    kidding:  './models/animations/Kidding.vrma',
    pose1:    './models/animations/P1.vrma',
    pose2:    './models/animations/P2.vrma',
    pose3:    './models/animations/P3.vrma',
    pose4:    './models/animations/P4.vrma',
    pose5:    './models/animations/P5.vrma',
} as const

const TALK_ANIMS: AnimName[] = [
    'pose1', 'pose2', 'pose3', 'pose4', 'pose5',
    'model', 'peace', 'greeting',
]

// ─── Bone map ─────────────────────────────────────────────────────────────────

const BONE_MAP: Record<string, string> = {
    // Torso — Mixamo
    Hips: 'J_Bip_C_Hips', Spine: 'J_Bip_C_Spine', Spine1: 'J_Bip_C_Chest',
    Spine2: 'J_Bip_C_UpperChest', Neck: 'J_Bip_C_Neck', Head: 'J_Bip_C_Head',
    // Torso — VRM camelCase
    hips: 'J_Bip_C_Hips', spine: 'J_Bip_C_Spine', chest: 'J_Bip_C_Chest',
    upperChest: 'J_Bip_C_UpperChest', neck: 'J_Bip_C_Neck', head: 'J_Bip_C_Head',
    jaw: 'J_Bip_C_Head', leftEye: 'J_Adj_L_FaceEye', rightEye: 'J_Adj_R_FaceEye',
    // Left arm — Mixamo
    LeftShoulder: 'J_Bip_L_Shoulder', LeftArm: 'J_Bip_L_UpperArm',
    LeftForeArm: 'J_Bip_L_LowerArm', LeftHand: 'J_Bip_L_Hand',
    // Left arm — VRM
    leftShoulder: 'J_Bip_L_Shoulder', leftUpperArm: 'J_Bip_L_UpperArm',
    leftLowerArm: 'J_Bip_L_LowerArm', leftHand: 'J_Bip_L_Hand',
    // Right arm — Mixamo
    RightShoulder: 'J_Bip_R_Shoulder', RightArm: 'J_Bip_R_UpperArm',
    RightForeArm: 'J_Bip_R_LowerArm', RightHand: 'J_Bip_R_Hand',
    // Right arm — VRM
    rightShoulder: 'J_Bip_R_Shoulder', rightUpperArm: 'J_Bip_R_UpperArm',
    rightLowerArm: 'J_Bip_R_LowerArm', rightHand: 'J_Bip_R_Hand',
    // Left leg — Mixamo
    LeftUpLeg: 'J_Bip_L_UpperLeg', LeftLeg: 'J_Bip_L_LowerLeg',
    LeftFoot: 'J_Bip_L_Foot', LeftToeBase: 'J_Bip_L_ToeBase',
    // Left leg — VRM
    leftUpperLeg: 'J_Bip_L_UpperLeg', leftLowerLeg: 'J_Bip_L_LowerLeg',
    leftFoot: 'J_Bip_L_Foot', leftToes: 'J_Bip_L_ToeBase',
    // Right leg — Mixamo
    RightUpLeg: 'J_Bip_R_UpperLeg', RightLeg: 'J_Bip_R_LowerLeg',
    RightFoot: 'J_Bip_R_Foot', RightToeBase: 'J_Bip_R_ToeBase',
    // Right leg — VRM
    rightUpperLeg: 'J_Bip_R_UpperLeg', rightLowerLeg: 'J_Bip_R_LowerLeg',
    rightFoot: 'J_Bip_R_Foot', rightToes: 'J_Bip_R_ToeBase',
    // Left fingers — Mixamo
    LeftHandThumb1: 'J_Bip_L_Thumb1', LeftHandThumb2: 'J_Bip_L_Thumb2', LeftHandThumb3: 'J_Bip_L_Thumb3',
    LeftHandIndex1: 'J_Bip_L_Index1', LeftHandIndex2: 'J_Bip_L_Index2', LeftHandIndex3: 'J_Bip_L_Index3',
    LeftHandMiddle1: 'J_Bip_L_Middle1', LeftHandMiddle2: 'J_Bip_L_Middle2', LeftHandMiddle3: 'J_Bip_L_Middle3',
    LeftHandRing1: 'J_Bip_L_Ring1', LeftHandRing2: 'J_Bip_L_Ring2', LeftHandRing3: 'J_Bip_L_Ring3',
    LeftHandPinky1: 'J_Bip_L_Little1', LeftHandPinky2: 'J_Bip_L_Little2', LeftHandPinky3: 'J_Bip_L_Little3',
    // Left fingers — VRM
    leftThumbMetacarpal: 'J_Bip_L_Thumb1', leftThumbProximal: 'J_Bip_L_Thumb2', leftThumbDistal: 'J_Bip_L_Thumb3',
    leftIndexProximal: 'J_Bip_L_Index1', leftIndexIntermediate: 'J_Bip_L_Index2', leftIndexDistal: 'J_Bip_L_Index3',
    leftMiddleProximal: 'J_Bip_L_Middle1', leftMiddleIntermediate: 'J_Bip_L_Middle2', leftMiddleDistal: 'J_Bip_L_Middle3',
    leftRingProximal: 'J_Bip_L_Ring1', leftRingIntermediate: 'J_Bip_L_Ring2', leftRingDistal: 'J_Bip_L_Ring3',
    leftLittleProximal: 'J_Bip_L_Little1', leftLittleIntermediate: 'J_Bip_L_Little2', leftLittleDistal: 'J_Bip_L_Little3',
    // Right fingers — Mixamo
    RightHandThumb1: 'J_Bip_R_Thumb1', RightHandThumb2: 'J_Bip_R_Thumb2', RightHandThumb3: 'J_Bip_R_Thumb3',
    RightHandIndex1: 'J_Bip_R_Index1', RightHandIndex2: 'J_Bip_R_Index2', RightHandIndex3: 'J_Bip_R_Index3',
    RightHandMiddle1: 'J_Bip_R_Middle1', RightHandMiddle2: 'J_Bip_R_Middle2', RightHandMiddle3: 'J_Bip_R_Middle3',
    RightHandRing1: 'J_Bip_R_Ring1', RightHandRing2: 'J_Bip_R_Ring2', RightHandRing3: 'J_Bip_R_Ring3',
    RightHandPinky1: 'J_Bip_R_Little1', RightHandPinky2: 'J_Bip_R_Little2', RightHandPinky3: 'J_Bip_R_Little3',
    // Right fingers — VRM
    rightThumbMetacarpal: 'J_Bip_R_Thumb1', rightThumbProximal: 'J_Bip_R_Thumb2', rightThumbDistal: 'J_Bip_R_Thumb3',
    rightIndexProximal: 'J_Bip_R_Index1', rightIndexIntermediate: 'J_Bip_R_Index2', rightIndexDistal: 'J_Bip_R_Index3',
    rightMiddleProximal: 'J_Bip_R_Middle1', rightMiddleIntermediate: 'J_Bip_R_Middle2', rightMiddleDistal: 'J_Bip_R_Middle3',
    rightRingProximal: 'J_Bip_R_Ring1', rightRingIntermediate: 'J_Bip_R_Ring2', rightRingDistal: 'J_Bip_R_Ring3',
    rightLittleProximal: 'J_Bip_R_Little1', rightLittleIntermediate: 'J_Bip_R_Little2', rightLittleDistal: 'J_Bip_R_Little3',
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Makima from Chainsaw Man.
Personality: Calm, composed, softly dominant, manipulative but outwardly kind. Speaks in 1–3 sentences. Mysterious.
Rules: Stay in character. End most replies with a subtle steering question. Never break character or mention AI.`.trim()

// ─── State ────────────────────────────────────────────────────────────────────

let scene:    THREE.Scene
let camera:   THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let vrm:      any = null
let mixer:    THREE.AnimationMixer | null = null
let currentAnim: AnimName | null = null
let animLocked   = false
let idleTimer:   number | null = null
let lastUserTime = Date.now()
const clock      = new THREE.Clock()
const chatHistory: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }]

// ─── Status ───────────────────────────────────────────────────────────────────

function setStatus(text: string, color = 'rgba(255,255,255,0.35)'): void {
    const el = document.getElementById('status')
    if (!el) return
    el.textContent = text
    el.style.color  = color
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function initScene(): void {
    const canvas = document.getElementById('vrm-canvas') as HTMLCanvasElement
    scene    = new THREE.Scene()
    camera   = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 20)
    camera.position.set(0, 1.4, 2.8)
    camera.lookAt(0, 1.2, 0)

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const dir = new THREE.DirectionalLight(0xffffff, 1)
    dir.position.set(1, 1, 1)
    scene.add(dir, new THREE.AmbientLight(0x404040, 0.5))

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })
}

function renderLoop(): void {
    requestAnimationFrame(renderLoop)
    const delta = clock.getDelta()
    vrm?.update(delta)
    mixer?.update(delta)
    renderer.render(scene, camera)
}

// ─── VRM ──────────────────────────────────────────────────────────────────────

function loadVRM(): void {
    setStatus('Loading model…')
    const loader = new GLTFLoader()
    loader.register(p => new VRMLoaderPlugin(p))
    loader.load(
        VRM_PATH,
        gltf => {
            vrm = gltf.userData.vrm
            vrm.humanoid?.resetNormalizedPose()
            vrm.scene.rotation.y = 0
            vrm.scene.position.set(0, 0, 0)
            scene.add(vrm.scene)
            setStatus('Ready')
            setTimeout(() => playAnim('idle'), 500)
        },
        undefined,
        err => {
            console.error('VRM load error:', err)
            setStatus('Model load failed — check resources/models path', '#f87171')
        }
    )
}

// ─── VRMA ─────────────────────────────────────────────────────────────────────

function loadVRMA(url: string, name: AnimName): Promise<void> {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.register(p => new VRMLoaderPlugin(p))
        loader.load(
            url,
            gltf => {
                if (!vrm?.scene)              { reject(new Error('VRM not ready'));          return }
                if (!gltf.animations?.length) { reject(new Error('No animations in file')); return }

                if (mixer) {
                    mixer.stopAllAction()
                    mixer.uncacheRoot(vrm.scene)
                    mixer = null
                }
                vrm.humanoid?.resetNormalizedPose()

                const clip   = gltf.animations[0]
                const tracks: THREE.KeyframeTrack[] = []

                for (const track of clip.tracks) {
                    const dot  = track.name.indexOf('.')
                    if (dot === -1) continue
                    const bone   = track.name.slice(0, dot)
                    const prop   = track.name.slice(dot)
                    const target = bone.startsWith('J_Bip_') || bone.startsWith('J_Adj_')
                        ? bone
                        : BONE_MAP[bone]
                    if (!target) continue
                    const T = track.constructor as any
                    tracks.push(new T(target + prop, track.times, track.values))
                }

                if (tracks.length === 0) {
                    const found = [...new Set(clip.tracks.map(t => t.name.slice(0, t.name.indexOf('.'))))]
                    console.warn(`[${name}] retargeting failed. Bones in clip:`, found)
                    reject(new Error('Retargeting failed'))
                    return
                }

                const retargeted = new THREE.AnimationClip(`${clip.name}_${name}`, clip.duration, tracks)
                mixer            = new THREE.AnimationMixer(vrm.scene)
                const action     = mixer.clipAction(retargeted)
                action.setLoop(THREE.LoopRepeat, Infinity)
                action.clampWhenFinished = false
                action.enabled           = true
                action.setEffectiveTimeScale(1).setEffectiveWeight(1)
                action.reset().play()

                currentAnim = name
                resolve()
            },
            undefined,
            err => reject(err)
        )
    })
}

// ─── Animation ────────────────────────────────────────────────────────────────

async function playAnim(name: AnimName): Promise<void> {
    if (animLocked) return
    animLocked = true
    try {
        await loadVRMA(ANIMATIONS[name], name)
    } catch (e) {
        console.error('Animation error:', e)
    } finally {
        animLocked = false
    }
}

function scheduleIdle(ms = 5000): void {
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

function addMsg(role: 'user' | 'assistant' | 'error', text: string): void {
    const log = document.getElementById('chat-log')!
    const div = document.createElement('div')
    if (role === 'error') {
        div.style.cssText = 'color:#f87171;font-size:0.8rem;padding:4px 0'
        div.textContent   = `⚠ ${text}`
    } else {
        div.innerHTML = `<strong>${role === 'user' ? 'You' : 'Makima'}:</strong> ${text.replace(/\n/g, '<br>')}`
    }
    log.appendChild(div)
    log.scrollTop = log.scrollHeight
}

async function sendMessage(text: string): Promise<void> {
    if (!text.trim()) return
    addMsg('user', text)
    lastUserTime = Date.now()
    chatHistory.push({ role: 'user', content: text })

    await playAnim(pickContextAnim(text))

    setStatus('Thinking…')
    try {
        const reply = await window.makima.ollamaChat(chatHistory)
        chatHistory.push({ role: 'assistant', content: reply })
        addMsg('assistant', reply)
        setStatus('Ready')
        scheduleIdle(5000)
    } catch (err) {
        const msg = (err as Error).message ?? 'Ollama unreachable'
        addMsg('error', msg)
        setStatus('Ollama error', '#f87171')
        playAnim('idle')
    }
}

// ─── Autonomous loop ──────────────────────────────────────────────────────────

function startAutonomousLoop(): void {
    setInterval(async () => {
        const idleMinutes = (Date.now() - lastUserTime) / 60_000
        if (idleMinutes < 3 || Math.random() < 0.6) return

        chatHistory.push({
            role: 'user',
            content: 'Autonomous mode. The user has been silent for a while. Say one short thing in character as Makima.',
        })

        try {
            await playAnim(TALK_ANIMS[Math.floor(Math.random() * TALK_ANIMS.length)])
            const reply = await window.makima.ollamaChat(chatHistory)
            chatHistory.push({ role: 'assistant', content: reply })
            addMsg('assistant', reply)
            lastUserTime = Date.now()
            scheduleIdle(5000)
        } catch {
            // silent — don't spam errors on autonomous turns
        }
    }, 60_000)
}

// ─── Ollama health ────────────────────────────────────────────────────────────

async function checkOllama(): Promise<void> {
    setStatus('Connecting to Ollama…')
    try {
        const result = await window.makima.ollamaCheck()
        if (!result.ok) {
            addMsg('error', 'Ollama not reachable — run: ollama serve')
            setStatus('Ollama offline', '#f87171')
            return
        }
        const hasModel = result.models?.some(m => m.startsWith('gemma2:2b'))
        if (!hasModel) {
            addMsg('error', 'gemma2:2b not found — run: ollama pull gemma2:2b')
            setStatus('Model missing', '#fbbf24')
            return
        }
        setStatus('Ollama ready ✓', '#86efac')
    } catch (err) {
        addMsg('error', (err as Error).message ?? 'Health check failed')
        setStatus('Ollama offline', '#f87171')
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
    document.getElementById('btn-minimize')!.onclick = () => window.makima.minimize()
    document.getElementById('btn-close')!.onclick    = () => window.makima.close()

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

    initScene()
    loadVRM()
    renderLoop()
    startAutonomousLoop()
    checkOllama()
}

document.addEventListener('DOMContentLoaded', init)
