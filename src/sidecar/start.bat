@echo off
cd /d "%~dp0"
call venv\Scripts\activate
echo Starting Makima TTS Server...
python tts_server.py
pause
