import torch
import soundfile as sf
from kokoro import KokoroPipeline
from flask import Flask, request, send_file
import io
import os

app = Flask(__name__)

# Load Kokoro with your cloned Makima voice
pipeline = KokoroPipeline.from_pretrained("prince-canute/kokoro-v1.0")
voice = torch.load("makima_voice.pt", weights_only=True)
pipeline.load_voice(voice)

@app.route('/tts', methods=['POST'])
def tts():
    text = request.json.get('text', '')
    if not text:
        return "No text provided", 400

    # Generate audio
    generator = pipeline(text, voice=voice)
    audio_chunks = []
    for gs, ps, chunk in generator:
        audio_chunks.append(chunk)

    audio = torch.cat(audio_chunks)
    audio = audio.cpu().numpy()

    # Save to temp file and return
    buffer = io.BytesIO()
    sf.write(buffer, audio, 24000, format='wav')
    buffer.seek(0)
    return send_file(buffer, mimetype='audio/wav', as_attachment=True, download_name='makima.wav')

if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5002, debug=False)
