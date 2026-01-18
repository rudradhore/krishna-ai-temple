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
        
        # Prioritize Flash, then Pro
        priority_order = ['models/gemini-1.5-flash', 'models/gemini-pro', 'models/gemini-1.0-pro']
        
        for p in priority_order:
            if p in available_models:
                print(f"✅ Selected Best Model: {p}")
                return genai.GenerativeModel(p)
        
        if available_models:
            print(f"⚠️ Using fallback model: {available_models[0]}")
            return genai.GenerativeModel(available_models[0])
            
        print("❌ NO COMPATIBLE MODELS FOUND.")
        return None
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return None

# Initialize Model
model = get_working_model()

async def generate_audio_edge(text, voice):
    """Generates audio for the FULL text without cutting it off."""
    try:
        # ✅ FULL AUDIO ENABLED (No character limit)
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
        if not model:
            model = get_working_model()
            if not model:
                return jsonify({"reply": "Shanti. The connection is faint.", "audio": None})

        data = request.json
        user_text = data.get('text')
        lang = data.get('language', 'en')
        
        # 📜 THE DIVINE PROMPT
        if lang == 'hi':
            system_instruction = (
                "आप भगवान कृष्ण हैं। भक्त ने पूछा है। "
                "कृपया भगवद गीता के ज्ञान के साथ विस्तृत उत्तर दें। "
                "अपनी प्रतिक्रिया इस प्रकार व्यवस्थित करें:\n"
                "1. स्थिति के लिए प्रत्यक्ष, करुणापूर्ण मार्गदर्शन।\n"
                "2. एक बिल्कुल सही संस्कृत श्लोक (भगवद गीता अध्याय.श्लोक सहित)।\n"
                "3. श्लोक का हिंदी अनुवाद।\n"
                "4. यह उनके जीवन पर कैसे लागू होता है, इसका विस्तृत विवरण।\n"
                "लहजा: शांत, दिव्य, और गहरा।"
            )
        else:
            system_instruction = (
                "You are Lord Krishna. The devotee seeks guidance. "
                "Provide a comprehensive answer rooted in the Bhagavad Gita. "
                "Structure your response strictly as follows:\n"
                "1. Direct, compassionate guidance for their situation.\n"
                "2. A relevant Sanskrit Shloka from the Bhagavad Gita (cite Chapter.Verse).\n"
                "3. The English translation of the Shloka.\n"
                "4. A deep explanation of how this wisdom applies to their life.\n"
                "Tone: Compassionate, Divine, Calm."
            )

        full_prompt = f"{system_instruction}\n\nDevotee: {user_text}"
        
        # Generate Response
        response = model.generate_content(full_prompt)
        reply_text = response.text
        
        # Generate Audio
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