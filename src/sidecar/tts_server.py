import os
import sys
import torch
import soundfile as sf
import numpy as np
import io
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from kokoro import KPipeline

app = Flask(__name__)
CORS(app)

# ─── Resolve paths — works as .py script and PyInstaller .exe ────────────────
BASE_DIR   = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
VOICE_PATH = os.path.join(BASE_DIR, 'makima_voice.pt')

print("Loading Kokoro...", flush=True)
pipeline = KPipeline(lang_code="a")
voice    = torch.load(VOICE_PATH, weights_only=True)
print("✅ Voice + Pipeline ready", flush=True)

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])        # ← fix 1: unindented, now registered
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/tts', methods=['POST'])
def tts():
    data = request.get_json(silent=True)
    text = (data or {}).get('text', '').strip()
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
