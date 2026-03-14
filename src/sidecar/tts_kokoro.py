#!/usr/bin/env python3
"""
Makima TTS Sidecar — Kokoro TTS Flask server
Electron calls POST /tts with JSON {"text": "..."}, returns WAV audio
"""

import os
import sys
import io
import torch
import numpy as np
import soundfile as sf
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from kokoro import KPipeline

app = Flask(__name__)
CORS(app)

# ─── Resolve paths — works both as .py and PyInstaller .exe ──────────────────
BASE_DIR   = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
VOICE_PATH = os.path.join(BASE_DIR, 'makima_voice.pt')

# ─── Load model once on startup ───────────────────────────────────────────────
print("Loading Kokoro pipeline...", flush=True)
pipeline = KPipeline(lang_code="a")  # American English
voice    = torch.load(VOICE_PATH, weights_only=True)
print("✅ Voice + Pipeline ready", flush=True)

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/tts', methods=['POST'])
def tts():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    text = data.get('text', '').strip()
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        generator    = pipeline(text, voice=voice)
        audio_chunks = []
        for _gs, _ps, chunk in generator:
            audio_chunks.append(chunk.cpu().numpy())

        audio  = np.concatenate(audio_chunks)
        buffer = io.BytesIO()
        sf.write(buffer, audio, 24000, format='wav')
        buffer.seek(0)

        return Response(
            buffer.getvalue(),
            mimetype='audio/wav',
            headers={'Content-Disposition': 'attachment; filename=makima.wav'}
        )
    except Exception as e:
        print(f"TTS error: {e}", flush=True)
        return jsonify({'error': str(e)}), 500

# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("TTS server ready at http://127.0.0.1:5002", flush=True)
    app.run(host='127.0.0.1', port=5002, debug=False)
