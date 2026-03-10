import torch
import soundfile as sf
import numpy as np
from flask import Flask, Response, request
from flask_cors import CORS
from kokoro.pipeline import KPipeline

app = Flask(__name__)
CORS(app)

print("✅ Loading kokoro...")
pipeline = KPipeline.from_pretrained("prince-canute/kokoro-v1.0")
voice = torch.load("makima_voice.pt", weights_only=True)
print(f"✅ Voice loaded on GPU: {torch.cuda.get_device_name(0)}")

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

    # Create WAV buffer
    buffer = io.BytesIO()
    sf.write(buffer, audio, 24000, format='wav')
    buffer.seek(0)

    return Response(
        buffer.getvalue(),
        mimetype='audio/wav',
        headers={'Content-Disposition': 'attachment; filename=makima.wav'}
    )

if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5002, debug=False)
