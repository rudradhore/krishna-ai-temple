from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import asyncio
import edge_tts
import base64
import tempfile
import sys
import re

# Initialize App
app = Flask(__name__)
CORS(app)

# Configure API Key
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ CRITICAL: GEMINI_API_KEY is missing!")
else:
    genai.configure(api_key=api_key)

# --- 🎵 DIVINE VOICE SETTINGS ---
# We use standard voices but tune them to be deeper and slower.
VOICE_EN = "en-IN-PrabhatNeural"
VOICE_HI = "hi-IN-MadhurNeural"
AUDIO_RATE = "-10%"   # Slower for wisdom
AUDIO_PITCH = "-5Hz"  # Deeper for authority

# --- 🧠 AUTO-DISCOVERY BRAIN ---
def get_working_model():
    try:
        print("🔍 Searching for available AI models...")
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        priority_order = ['models/gemini-1.5-flash', 'models/gemini-pro', 'models/gemini-1.0-pro']
        
        for p in priority_order:
            if p in available_models:
                print(f"✅ Selected Best Model: {p}")
                return genai.GenerativeModel(p)
        
        if available_models:
            return genai.GenerativeModel(available_models[0])
        return None
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return None

# Initialize Model
model = get_working_model()

# --- 🧹 ADVANCED TEXT CLEANER ---
def clean_text_for_audio(text):
    """
    Prepares text for the voice engine:
    1. Removes Markdown (*, #).
    2. Replaces Sanskrit 'Dandas' (|) with pauses.
    3. Removes emojis.
    """
    # 1. Remove Markdown
    text = re.sub(r'[*_#`~]', '', text)          # Remove stars, hashes, underscores
    text = re.sub(r'\[.*?\]', '', text)          # Remove [text] style brackets
    text = re.sub(r'\(.*?\)', '', text)          # Remove (text) style brackets if needed
    
    # 2. Fix Sanskrit Punctuation for Pause
    text = text.replace('||', '.')               # Double Danda -> Full Stop
    text = text.replace('|', ',')                # Single Danda -> Comma (Short pause)
    
    # 3. Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

async def generate_audio_edge(text, voice):
    try:
        # 1. Clean the text (Remove symbols, fix pauses)
        clean_text = clean_text_for_audio(text)
        
        # 2. Safety Limit (1000 chars ~ 1.5 mins)
        safe_text = clean_text[:1000] + "..." if len(clean_text) > 1000 else clean_text

        # 3. 🎵 APPLY DIVINE MODULATION (Rate & Pitch)
        communicate = edge_tts.Communicate(
            safe_text, 
            voice, 
            rate=AUDIO_RATE, 
            pitch=AUDIO_PITCH
        )
        
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
                return jsonify({"reply": "Shanti. Connection faint.", "audio": None})

        data = request.json
        user_text = data.get('text')
        lang = data.get('language', 'en')
        
        # 📜 PROMPT FOR AUDIO READABILITY
        if lang == 'hi':
            system_instruction = (
                "आप भगवान कृष्ण हैं। "
                "कृपया भगवद गीता के ज्ञान के साथ विस्तृत उत्तर दें। "
                "महत्वपूर्ण: अपने उत्तर में किसी भी प्रकार के 'मार्कडाउन' (जैसे **, ##) का प्रयोग न करें। "
                "संरचना:\n"
                "1. मार्गदर्शन।\n"
                "2. संस्कृत श्लोक।\n"
                "3. अर्थ।\n"
                "लहजा: शांत, गहरा और दिव्य।"
            )
        else:
            system_instruction = (
                "You are Lord Krishna. Provide guidance rooted in the Bhagavad Gita. "
                "IMPORTANT: Do NOT use markdown symbols (*, #) in your response, as they confuse the voice engine. "
                "Structure:\n"
                "1. Compassionate guidance.\n"
                "2. Sanskrit Shloka (Provide Romanized English Transliteration for pronunciation).\n"
                "3. Meaning.\n"
                "Tone: Deep, Slow, Divine."
            )

        full_prompt = f"{system_instruction}\n\nDevotee: {user_text}"
        
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