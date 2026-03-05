// animations_VRM.ts

const BASE = window.location.protocol === 'file:' ? './resources/models' : './models'

export const VRM_PATH = `${BASE}/makimaModel.vrm`

export const Animations_VRM =
    {
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

export type AnimName = keyof typeof Animations_VRM

export const TALK_ANIMS: AnimName[] = [
    'pose1', 'pose2', 'pose3', 'pose4', 'pose5',
    'model', 'peace', 'greeting',
]

export const VRM_INTERNAL_BONES = new Set([
    'J_Adj_L_FaceEye', 'J_Adj_R_FaceEye',
    'leftEye', 'rightEye', 'LeftEye', 'RightEye',
])