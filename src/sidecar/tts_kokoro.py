#!/usr/bin/env python3
"""
Makima TTS Sidecar — Kokoro TTS with voice cloning
Receives JSON text via stdin, outputs base64 WAV via stdout
"""

import sys
import json
import base64
import io
import soundfile as sf
from kokoro_tts import KokoroTTS

# Load model once on startup (uses your RTX 5070 Ti CUDA)
tts = KokoroTTS()
VOICE_REF = "makima_voice.wav"  # Put your sample here

print("✅ Kokoro TTS sidecar ready", file=sys.stderr, flush=True)

for line in sys.stdin:
    try:
        data = json.loads(line.strip())
        text = data["text"]
        
        # Generate speech with Makima's voice
        audio = tts.synthesize(
            text,
            ref_audio=VOICE_REF,
            speed=0.88,           # Makima's slow, deliberate pace
            temperature=0.3,      # Low randomness = consistent voice
            lang="en-us"
        )
        
        # Encode as base64 WAV for Electron
        buf = io.BytesIO()
        sf.write(buf, audio, 24000, format='WAV')
        b64_audio = base64.b64encode(buf.getvalue()).decode()
        
        print(json.dumps({"audio": b64_audio, "sr": 24000}), flush=True)
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr, flush=True)
