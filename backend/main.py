from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import asyncio
import edge_tts
import base64
import tempfile
import sys

# Initialize App
app = Flask(__name__)
CORS(app)

# Configure API Key
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ CRITICAL: GEMINI_API_KEY is missing!")
else:
    genai.configure(api_key=api_key)

# Voice Settings
VOICE_EN = "en-IN-PrabhatNeural"
VOICE_HI = "hi-IN-MadhurNeural"

# --- 🧠 AUTO-DISCOVERY BRAIN ---
def get_working_model():
    """Asks Google which models are available and picks the first chat model."""
    try:
        print("🔍 Searching for available AI models...")
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
                print(f"   - Found: {m.name}")
        
        # Prioritize Flash, then Pro, then anything else
        priority_order = ['models/gemini-1.5-flash', 'models/gemini-pro', 'models/gemini-1.0-pro']
        
        for p in priority_order:
            if p in available_models:
                print(f"✅ Selected Best Model: {p}")
                return genai.GenerativeModel(p)
        
        # If priority models aren't found, grab the first available one
        if available_models:
            first_model = available_models[0]
            print(f"⚠️ Priority models missing. Using fallback: {first_model}")
            return genai.GenerativeModel(first_model)
            
        print("❌ NO COMPATIBLE MODELS FOUND FOR THIS KEY.")
        return None
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return None

# Initialize Model Global Variable
print("🚀 Server Starting... initializing AI...")
model = get_working_model()

async def generate_audio_edge(text, voice):
    try:
        communicate = edge_tts.Communicate(text, voice)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_filename = temp_file.name
        await communicate.save(temp_filename)
        with open(temp_filename, "rb") as f:
            audio_bytes = f.read()
        os.remove(temp_filename)
        return base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        print(f"Audio Gen Error: {e}")
        return None

@app.route('/chat', methods=['POST'])
def chat():
    global model
    try:
        # Re-try finding model if it failed at startup
        if not model:
            model = get_working_model()
            if not model:
                return jsonify({"reply": "Shanti. API Key Error.", "audio": None})

        data = request.json
        user_text = data.get('text')
        lang = data.get('language', 'en')
        
        prompt = f"You are Krishna. Answer briefly in 2 sentences. User: {user_text}"
        
        # GENERATE RESPONSE
        response = model.generate_content(prompt)
        reply_text = response.text
        
        # GENERATE AUDIO
        voice = VOICE_HI if lang == 'hi' else VOICE_EN
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio_base64 = loop.run_until_complete(generate_audio_edge(reply_text, voice))
        loop.close()
        
        return jsonify({"reply": reply_text, "audio": audio_base64})

    except Exception as e:
        print(f"❌ Error during chat: {e}")
        return jsonify({"reply": "Shanti. Look within.", "audio": None})

@app.route('/', methods=['GET'])
def health_check():
    return "Krishna AI Temple is Live."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)