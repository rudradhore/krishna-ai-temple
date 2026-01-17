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
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Voice Settings
VOICE_EN = "en-IN-PrabhatNeural"
VOICE_HI = "hi-IN-MadhurNeural"

# System Prompts
ENGLISH_PROMPT = "You are Krishna. Answer briefly (max 2 sentences) with divine wisdom. Tone: Calm, Masculine."
HINDI_PROMPT = "आप कृष्ण हैं। संक्षेप में (अधिकतम 2 वाक्य) उत्तर दें। लहजा: शांत, पुरुषोचित।"

async def generate_audio_edge(text, voice):
    """Generates audio using Edge TTS"""
    communicate = edge_tts.Communicate(text, voice)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        temp_filename = temp_file.name
    await communicate.save(temp_filename)
    with open(temp_filename, "rb") as f:
        audio_bytes = f.read()
    os.remove(temp_filename)
    return base64.b64encode(audio_bytes).decode('utf-8')

def get_krishna_response(text, lang):
    # 🛡️ SMART FALLBACK: Try these models in order until one works
    models_to_try = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.0-pro']
    
    prompt = HINDI_PROMPT if lang == 'hi' else ENGLISH_PROMPT
    full_prompt = f"{prompt}\n\nUser: {text}"

    for model_name in models_to_try:
        try:
            print(f"Trying AI Model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"❌ Model {model_name} failed: {e}")
            continue # Try the next model in the list
            
    # If all models fail
    print("All AI models failed.")
    return "Shanti. Look within."

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_text = data.get('text')
        lang = data.get('language', 'en')
        
        if not user_text:
            return jsonify({"error": "No text"}), 400

        # 1. Get Text (With Smart Fallback)
        reply_text = get_krishna_response(user_text, lang)
        
        # 2. Get Voice
        voice = VOICE_HI if lang == 'hi' else VOICE_EN
        
        # 3. Generate Audio
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            audio_base64 = loop.run_until_complete(generate_audio_edge(reply_text, voice))
            loop.close()
        except Exception as e:
            print(f"Audio Error: {e}")
            audio_base64 = None
        
        return jsonify({"reply": reply_text, "audio": audio_base64})

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"reply": "Connection faint...", "audio": None})

@app.route('/', methods=['GET'])
def health_check():
    return "Krishna AI Temple Backend is Live."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)