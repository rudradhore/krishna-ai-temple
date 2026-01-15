from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import asyncio
import edge_tts
import base64
import tempfile

# Initialize App
app = Flask(__name__)
CORS(app)
        

# Configure API Key
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Voices
VOICE_EN = "en-IN-PrabhatNeural"
VOICE_HI = "hi-IN-MadhurNeural"

# Prompts
ENGLISH_PROMPT = "You are Krishna. Answer briefly (max 2 sentences) with divine wisdom. Tone: Calm, Masculine."
HINDI_PROMPT = "आप कृष्ण हैं। संक्षेप में (अधिकतम 2 वाक्य) उत्तर दें। लहजा: शांत, पुरुषोचित।"

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
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = HINDI_PROMPT if lang == 'hi' else ENGLISH_PROMPT
        response = model.generate_content(f"{prompt}\n\nUser: {text}")
        return response.text
    except Exception as e:
        print(f"AI Error: {e}")
        return "Shanti."

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_text = data.get('text')
        lang = data.get('language', 'en')
        
        if not user_text:
            return jsonify({"error": "No text"}), 400

        reply_text = get_krishna_response(user_text, lang)
        voice = VOICE_HI if lang == 'hi' else VOICE_EN
        
        # Async call
        audio_base64 = asyncio.run(generate_audio_edge(reply_text, voice))
        
        return jsonify({"reply": reply_text, "audio": audio_base64})
    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"reply": "Connection faint...", "audio": None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)