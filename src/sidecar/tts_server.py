import torch
import soundfile as sf
import numpy as np
import io  # ← THIS WAS MISSING
from flask import Flask, Response, request
from flask_cors import CORS
from kokoro import KPipeline

app = Flask(__name__)
CORS(app)

print(" Loading kokoro...")
pipeline = KPipeline(lang_code="a")  # American English
voice = torch.load("makima_voice.pt", weights_only=True)
print(" Voice + Pipeline ready")

@app.route('/tts', methods=['POST'])
def tts():
    text = request.json.get('text', '')
    if not text:
        return "No text provided", 400

    # Generate audio
    generator = pipeline(text, voice=voice)
    audio_chunks = []
    for gs, ps, chunk in generator:
        audio_chunks.append(chunk.cpu().numpy())

    audio = np.concatenate(audio_chunks)

    buffer = io.BytesIO()
    sf.write(buffer, audio, 24000, format='wav')
    buffer.seek(0)

    return Response(
        buffer.getvalue(),
        mimetype='audio/wav',
        headers={'Content-Disposition': 'attachment; filename=makima.wav'}
    )

    @app.route('/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200

if __name__ == "__main__":
    print("TTS server ready at http://127.0.0.1:5002/tts")
    app.run(host='127.0.0.1', port=5002, debug=False)
