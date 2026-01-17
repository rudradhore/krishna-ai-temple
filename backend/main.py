from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import asyncio
import edge_tts
import base64
import tempfile

app = Flask(__name__)
CORS(app)

# Configure API Key
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Voice Settings
VOICE_EN = "en-IN-PrabhatNeural"
VOICE_HI = "hi-IN-MadhurNeural"

async def generate_audio_edge(text, voice):
    communicate = edge_tts.Communicate(text, voice)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        temp_filename = temp_file.name
    await communicate.save(temp_filename)
    with open(temp_filename, "rb") as f:
        audio_bytes = f.read()
    os.remove(temp_filename)
    return base64.b64encode(audio_bytes).decode('utf-8')

def get_krishna_response(text, lang):
    # Try the most standard model first
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(f"You are Krishna. Answer briefly. User: {text}")
        return response.text
    except Exception as e:
        print(f"❌ Primary Model Failed: {e}")
        try:
            # Fallback to older model
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(f"You are Krishna. Answer briefly. User: {text}")
            return response.text
        except Exception as e2:
            print(f"❌ Backup Model Failed: {e2}")
            return "Shanti. Look within."

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    text = data.get('text')
    lang = data.get('language', 'en')
    
    # Get Text
    reply = get_krishna_response(text, lang)
    
    # Get Audio
    voice = VOICE_HI if lang == 'hi' else VOICE_EN
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio = loop.run_until_complete(generate_audio_edge(reply, voice))
        loop.close()
    except:
        audio = None
        
    return jsonify({"reply": reply, "audio": audio})

# 🕵️‍♂️ NEW DIAGNOSTIC ROUTE
@app.route('/debug', methods=['GET'])
def debug():
    try:
        models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models.append(m.name)
        return jsonify({"status": "Key is working", "available_models": models})
    except Exception as e:
        return jsonify({"status": "Key Failed", "error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)