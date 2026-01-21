from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import asyncio
import edge_tts
import base64
import tempfile
import sys
import re  # ✅ Added regex for cleaning text

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

# --- 🧹 TEXT CLEANER FOR AUDIO ---
def clean_text_for_audio(text):
    """
    Removes Markdown symbols (*, #, -) so the voice doesn't read them.
    """
    # Remove bold/italic markers (**word** -> word)
    text = re.sub(r'\*\*|__', '', text)
    text = re.sub(r'\*|_', '', text)
    
    # Remove headers (## Title -> Title)
    text = re.sub(r'#+', '', text)
    
    # Remove bullet points/lists (- Item -> Item)
    text = re.sub(r'^[\-\*]\s+', '', text, flags=re.MULTILINE)
    
    # Remove code blocks
    text = re.sub(r'`', '', text)
    
    # Collapse multiple spaces/newlines into a single pause
    text = re.sub(r'\n+', '. ', text)
    
    return text.strip()

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

async def generate_audio_edge(text, voice):
    try:
        # 1. CLEAN THE TEXT (Remove symbols)
        clean_text = clean_text_for_audio(text)
        
        # 2. SAFETY LIMIT (Prevents crash, keeps main content)
        safe_text = clean_text[:1000] + "..." if len(clean_text) > 1000 else clean_text

        communicate = edge_tts.Communicate(safe_text, voice)
        
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
        
        # 📜 UPDATED PROMPT: Request Transliteration for Shlokas
        if lang == 'hi':
            system_instruction = (
                "आप भगवान कृष्ण हैं। "
                "कृपया भगवद गीता के ज्ञान के साथ विस्तृत उत्तर दें। "
                "अपनी प्रतिक्रिया इस प्रकार व्यवस्थित करें:\n"
                "1. स्थिति के लिए मार्गदर्शन।\n"
                "2. संस्कृत श्लोक (देवनागरी में)।\n"
                "3. श्लोक का अर्थ।\n"
                "4. जीवन में प्रयोग।\n"
                "लहजा: शांत, दिव्य। स्वरूपण (Formatting) के लिए तारों (*) का प्रयोग न करें।"
            )
        else:
            system_instruction = (
                "You are Lord Krishna. Provide guidance rooted in the Bhagavad Gita. "
                "Structure strictly as follows:\n"
                "1. Compassionate guidance.\n"
                "2. A relevant Sanskrit Shloka (Provide BOTH Devanagari script AND Romanized English transliteration so it can be read aloud).\n"
                "3. English translation.\n"
                "4. Explanation.\n"
                "Tone: Divine. Do NOT use markdown symbols like ** or ## in your output."
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