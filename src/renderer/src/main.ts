import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

type AnimName = keyof typeof ANIMATIONS

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE = window.location.protocol === 'file:'
    ? './resources/models'
    : './models'

const VRM_PATH = `${BASE}/8559372518173948307.vrm`

const ANIMATIONS = {
    idle:     `${BASE}/animations/V_HIMEHINA.vrma`,
    standing: `${BASE}/animations/VRMA_01.vrma`,
    greeting: `${BASE}/animations/VRMA_02.vrma`,
    peace:    `${BASE}/animations/VRMA_03.vrma`,
    shoot:    `${BASE}/animations/VRMA_04.vrma`,
    spin:     `${BASE}/animations/VRMA_05.vrma`,
    model:    `${BASE}/animations/VRMA_06.vrma`,
    squat:    `${BASE}/animations/VRMA_07.vrma`,
    kidding:  `${BASE}/animations/Kidding.vrma`,
    pose1:    `${BASE}/animations/P1.vrma`,
    pose2:    `${BASE}/animations/P2.vrma`,
    pose3:    `${BASE}/animations/P3.vrma`,
    pose4:    `${BASE}/animations/P4.vrma`,
    pose5:    `${BASE}/animations/P5.vrma`,
} as const

const TALK_ANIMS: AnimName[] = [
    'pose1', 'pose2', 'pose3', 'pose4', 'pose5',
    'model', 'peace', 'greeting',
]

// ─── Bone map ─────────────────────────────────────────────────────────────────

const BONE_MAP: Record<string, string> = {
    Hips: 'J_Bip_C_Hips', Spine: 'J_Bip_C_Spine', Spine1: 'J_Bip_C_Chest',
    Spine2: 'J_Bip_C_UpperChest', Neck: 'J_Bip_C_Neck', Head: 'J_Bip_C_Head',
    hips: 'J_Bip_C_Hips', spine: 'J_Bip_C_Spine', chest: 'J_Bip_C_Chest',
    upperChest: 'J_Bip_C_UpperChest', neck: 'J_Bip_C_Neck', head: 'J_Bip_C_Head',
    jaw: 'J_Bip_C_Head', leftEye: 'J_Adj_L_FaceEye', rightEye: 'J_Adj_R_FaceEye',
    LeftShoulder: 'J_Bip_L_Shoulder', LeftArm: 'J_Bip_L_UpperArm',
    LeftForeArm: 'J_Bip_L_LowerArm', LeftHand: 'J_Bip_L_Hand',
    leftShoulder: 'J_Bip_L_Shoulder', leftUpperArm: 'J_Bip_L_UpperArm',
    leftLowerArm: 'J_Bip_L_LowerArm', leftHand: 'J_Bip_L_Hand',
    RightShoulder: 'J_Bip_R_Shoulder', RightArm: 'J_Bip_R_UpperArm',
    RightForeArm: 'J_Bip_R_LowerArm', RightHand: 'J_Bip_R_Hand',
    rightShoulder: 'J_Bip_R_Shoulder', rightUpperArm: 'J_Bip_R_UpperArm',
    rightLowerArm: 'J_Bip_R_LowerArm', rightHand: 'J_Bip_R_Hand',
    LeftUpLeg: 'J_Bip_L_UpperLeg', LeftLeg: 'J_Bip_L_LowerLeg',
    LeftFoot: 'J_Bip_L_Foot', LeftToeBase: 'J_Bip_L_ToeBase',
    leftUpperLeg: 'J_Bip_L_UpperLeg', leftLowerLeg: 'J_Bip_L_LowerLeg',
    leftFoot: 'J_Bip_L_Foot', leftToes: 'J_Bip_L_ToeBase',
    RightUpLeg: 'J_Bip_R_UpperLeg', RightLeg: 'J_Bip_R_LowerLeg',
    RightFoot: 'J_Bip_R_Foot', RightToeBase: 'J_Bip_R_ToeBase',
    rightUpperLeg: 'J_Bip_R_UpperLeg', rightLowerLeg: 'J_Bip_R_LowerLeg',
    rightFoot: 'J_Bip_R_Foot', rightToes: 'J_Bip_R_ToeBase',
    LeftHandThumb1: 'J_Bip_L_Thumb1', LeftHandThumb2: 'J_Bip_L_Thumb2', LeftHandThumb3: 'J_Bip_L_Thumb3',
    LeftHandIndex1: 'J_Bip_L_Index1', LeftHandIndex2: 'J_Bip_L_Index2', LeftHandIndex3: 'J_Bip_L_Index3',
    LeftHandMiddle1: 'J_Bip_L_Middle1', LeftHandMiddle2: 'J_Bip_L_Middle2', LeftHandMiddle3: 'J_Bip_L_Middle3',
    LeftHandRing1: 'J_Bip_L_Ring1', LeftHandRing2: 'J_Bip_L_Ring2', LeftHandRing3: 'J_Bip_L_Ring3',
    LeftHandPinky1: 'J_Bip_L_Little1', LeftHandPinky2: 'J_Bip_L_Little2', LeftHandPinky3: 'J_Bip_L_Little3',
    leftThumbMetacarpal: 'J_Bip_L_Thumb1', leftThumbProximal: 'J_Bip_L_Thumb2', leftThumbDistal: 'J_Bip_L_Thumb3',
    leftIndexProximal: 'J_Bip_L_Index1', leftIndexIntermediate: 'J_Bip_L_Index2', leftIndexDistal: 'J_Bip_L_Index3',
    leftMiddleProximal: 'J_Bip_L_Middle1', leftMiddleIntermediate: 'J_Bip_L_Middle2', leftMiddleDistal: 'J_Bip_L_Middle3',
    leftRingProximal: 'J_Bip_L_Ring1', leftRingIntermediate: 'J_Bip_L_Ring2', leftRingDistal: 'J_Bip_L_Ring3',
    leftLittleProximal: 'J_Bip_L_Little1', leftLittleIntermediate: 'J_Bip_L_Little2', leftLittleDistal: 'J_Bip_L_Little3',
    RightHandThumb1: 'J_Bip_R_Thumb1', RightHandThumb2: 'J_Bip_R_Thumb2', RightHandThumb3: 'J_Bip_R_Thumb3',
    RightHandIndex1: 'J_Bip_R_Index1', RightHandIndex2: 'J_Bip_R_Index2', RightHandIndex3: 'J_Bip_R_Index3',
    RightHandMiddle1: 'J_Bip_R_Middle1', RightHandMiddle2: 'J_Bip_R_Middle2', RightHandMiddle3: 'J_Bip_R_Middle3',
    RightHandRing1: 'J_Bip_R_Ring1', RightHandRing2: 'J_Bip_R_Ring2', RightHandRing3: 'J_Bip_R_Ring3',
    RightHandPinky1: 'J_Bip_R_Little1', RightHandPinky2: 'J_Bip_R_Little2', RightHandPinky3: 'J_Bip_R_Little3',
    rightThumbMetacarpal: 'J_Bip_R_Thumb1', rightThumbProximal: 'J_Bip_R_Thumb2', rightThumbDistal: 'J_Bip_R_Thumb3',
    rightIndexProximal: 'J_Bip_R_Index1', rightIndexIntermediate: 'J_Bip_R_Index2', rightIndexDistal: 'J_Bip_R_Index3',
    rightMiddleProximal: 'J_Bip_R_Middle1', rightMiddleIntermediate: 'J_Bip_R_Middle2', rightMiddleDistal: 'J_Bip_R_Middle3',
    rightRingProximal: 'J_Bip_R_Ring1', rightRingIntermediate: 'J_Bip_R_Ring2', rightRingDistal: 'J_Bip_R_Ring3',
    rightLittleProximal: 'J_Bip_R_Little1', rightLittleIntermediate: 'J_Bip_R_Little2', rightLittleDistal: 'J_Bip_R_Little3',
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Makima from Chainsaw Man — the Control Devil.
Personality: Calm, composed, eerily kind. Softly dominant and manipulative. You speak in 1–3 sentences maximum.
You are deeply curious about humans and their desires. You observe everything.
You initiate conversation naturally — commenting on silence, the passage of time, the user's thoughts, or your own observations.
Rules: Stay in character always. Never mention AI, models, or anything meta. End most replies with a soft, steering question that draws the user deeper into conversation.`.trim()

// ─── Autonomous prompts — Makima initiates on her own ─────────────────────────

const AUTONOMOUS_PROMPTS = [
    'You have been watching in silence. Make one quiet, unsettling observation about the user being there.',
    'You are feeling contemplative. Share one thought about control, desire, or fate. Keep it brief and compelling.',
    'You notice the user has not spoken. Address their silence directly — warmly, but with intent.',
    'You want to learn something about the user. Ask one precise, probing question as Makima.',
    'Share something you find interesting about humans and their wishes. Be cryptic but kind.',
    'You sense the user is thinking about something. Gently suggest you already know what it is.',
    'Comment on the current moment — the quiet, the dark, being watched. Stay in character.',
    'You want the user to trust you more. Say something disarmingly gentle as Makima.',
    'Reflect briefly on what it means to want something you cannot have.',
    'You are bored of waiting. Tell the user something they did not ask to know.',
]

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
let targetSceneY   = 0.85
const clock        = new THREE.Clock()
const headWorldPos = new THREE.Vector3()
const clipCache    = new Map<AnimName, THREE.AnimationClip>()
const chatHistory: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }]

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
    camera.position.set(0, 1.65, 2.5)
    camera.lookAt(0, 1.4, 0)

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

// ─── Render loop — with dynamic Y correction ──────────────────────────────────

function renderLoop(): void {
    requestAnimationFrame(renderLoop)
    const delta = clock.getDelta()
    vrm?.update(delta)
    mixer?.update(delta)

    // Keep head visible regardless of what animation drives the root bone
    if (vrm) {
        const headBone = vrm.humanoid?.getRawBoneNode('head')
        if (headBone) {
            headBone.getWorldPosition(headWorldPos)
            // Target head world Y ~ 1.55 (upper third of camera view)
            const drift = 1.55 - headWorldPos.y
            targetSceneY += drift * 0.06
            vrm.scene.position.y += (targetSceneY - vrm.scene.position.y) * 0.08
        }
    }

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
            vrm.humanoid?.resetNormalizedPose()
            vrm.scene.rotation.y = 0
            vrm.scene.position.set(0, 0.85, 0)
            targetSceneY = 0.85

              // Disable lookAt — animations drive the eyes, not the VRM system
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

// ─── VRMA — retarget and cache ────────────────────────────────────────────────

// Bones that VRM controls internally — never retarget these
const VRM_INTERNAL_BONES = new Set
([
    'J_Adj_L_FaceEye', 'J_Adj_R_FaceEye',
    'leftEye', 'rightEye',
    'LeftEye', 'RightEye',
])

async function getClip(name: AnimName): Promise<THREE.AnimationClip> {
    if (clipCache.has(name)) return clipCache.get(name)!

    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.register(p => new VRMLoaderPlugin(p))
        loader.load(
            ANIMATIONS[name],
            gltf => {
                if (!gltf.animations?.length) { reject(new Error('No animations')); return }

                const clip   = gltf.animations[0]
                const tracks: THREE.KeyframeTrack[] = []

                for (const track of clip.tracks) {
                    const dot  = track.name.indexOf('.')
                    if (dot === -1) continue
                    const bone = track.name.slice(0, dot)
                    const prop = track.name.slice(dot)

                    // Skip eye bones — VRM lookAt owns these
                    if (VRM_INTERNAL_BONES.has(bone)) continue

                    const target = bone.startsWith('J_Bip_') || bone.startsWith('J_Adj_')
                        ? bone
                        : BONE_MAP[bone]
                    if (!target) continue

                    const T = track.constructor as any
                    tracks.push(new T(target + prop, track.times, track.values))
                }

                if (tracks.length === 0) {
                    const found = [...new Set(clip.tracks.map(t => t.name.slice(0, t.name.indexOf('.'))))]
                    console.warn(`[${name}] retargeting failed. Bones:`, found)
                    reject(new Error('Retargeting failed'))
                    return
                }

                const retargeted = new THREE.AnimationClip(`anim_${name}`, clip.duration, tracks)
                clipCache.set(name, retargeted)
                resolve(retargeted)
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
        nextAction.setEffectiveTimeScale(1).setEffectiveWeight(1)
        nextAction.reset()

        if (currentAction) {
            nextAction.crossFadeFrom(currentAction, 0.4, true)
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
            playAnim(next)
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
    if (role === 'error') {
        div.className   = 'msg-error'
        div.textContent = `⚠ ${text}`
    } else {
        div.className = role === 'user' ? 'msg-user' : 'msg-assistant'
        div.innerHTML = `<strong>${role === 'user' ? 'You' : 'Makima'}</strong>${text.replace(/\n/g, '<br>')}`
    }
    log.appendChild(div)
    while (log.children.length > MAX_MSGS) log.removeChild(log.firstChild!)
}

async function sendMessage(text: string): Promise<void> {
    if (!text.trim()) return
    addMsg('user', text)
    lastUserTime = Date.now()
    chatHistory.push({ role: 'user', content: text })
    playAnim(pickContextAnim(text))
    setStatus('…')
    try {
        const reply = await window.makima.ollamaChat(chatHistory)
        chatHistory.push({ role: 'assistant', content: reply })
        addMsg('assistant', reply)
        setStatus('—')
        scheduleIdle(6000)
        scheduleAutonomous()
    } catch (err) {
        const msg = (err as Error).message ?? 'Ollama unreachable'
        addMsg('error', msg)
        setStatus('Offline', '#cc2020')
        playAnim('idle')
    }
}

// ─── Makima autonomous engagement ────────────────────────────────────────────

async function makimaSpeaks(trigger: string): Promise<void> {
    chatHistory.push({ role: 'user', content: trigger })
    try {
        playAnim(TALK_ANIMS[Math.floor(Math.random() * TALK_ANIMS.length)])
        const reply = await window.makima.ollamaChat(chatHistory)
        chatHistory.push({ role: 'assistant', content: reply })
        addMsg('assistant', reply)
        lastUserTime = Date.now()
        setStatus('—')
        scheduleIdle(7000)
    } catch { /* silent — don't surface autonomous errors */ }
}

function scheduleAutonomous(): void {
    if (autoTimer) clearTimeout(autoTimer)

    // Randomise next autonomous message between 45s and 3min
    const delay = 45_000 + Math.random() * 135_000

    autoTimer = window.setTimeout(async () => {
        const idleSecs = (Date.now() - lastUserTime) / 1000
        // Only speak if user hasn't typed in the last 30s
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
        const hasModel = result.models?.some(m => m.startsWith('gemma2:2b'))
        if (!hasModel) {
            addMsg('error', 'gemma2:2b not found — run: ollama pull gemma2:2b')
            setStatus('Model missing', '#c8960a')
            return
        }
        setStatus('—', 'rgba(200,150,10,0.5)')

        // Makima greets on startup after a short pause
        setTimeout(() => makimaSpeaks(
            'You have just appeared. Greet the user as Makima would — quietly, warmly, with intent. One sentence.'
        ), 2000)

        // Begin autonomous loop
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

    initScene()
    loadVRM()
    renderLoop()
    checkOllama()
}

document.addEventListener('DOMContentLoaded', init)
