from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import asyncio
import edge_tts
import base64
import tempfile

# ✅ CORRECT
app = Flask(__name__)
CORS(app)

# Configure Gemini API Key
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# --- SYSTEM PROMPTS (MALE PERSONA) ---
ENGLISH_PROMPT = """
You are Krishna. Speak to the devotee with deep wisdom, authority, and compassion. 
Keep answers brief (max 2 sentences). 
Tone: Divine, Calm, Masculine, Reassuring. 
"""

HINDI_PROMPT = """
आप भगवान कृष्ण हैं। भक्त से गहरे ज्ञान, अधिकार और करुणा के साथ बात करें।
उत्तर संक्षिप्त रखें (अधिकतम 2 वाक्य)।
लहजा: दिव्य, शांत, पुरुषोचित, आश्वस्त करने वाला।
"""

# --- MALE VOICE SETTINGS ---
# Prabhat = Indian Male (English)
# Madhur = Indian Male (Hindi)
VOICE_EN = "en-IN-PrabhatNeural"
VOICE_HI = "hi-IN-MadhurNeural"

async def generate_audio_edge(text, voice):
    """Generates audio using Edge TTS and returns base64 string"""
    communicate = edge_tts.Communicate(text, voice)
    
    # Create a temporary file to store the audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        temp_filename = temp_file.name
    
    await communicate.save(temp_filename)
    
    # Read the file back as bytes
    with open(temp_filename, "rb") as f:
        audio_bytes = f.read()
    
    # Clean up temp file
    os.remove(temp_filename)
    
    return base64.b64encode(audio_bytes).decode('utf-8')

def get_krishna_response(text, lang):
    try:
        model = genai.GenerativeModel('gemini-pro')
        # Select prompt based on language
        prompt = HINDI_PROMPT if lang == 'hi' else ENGLISH_PROMPT
        response = model.generate_content(f"{prompt}\n\nDevotee: {text}")
        return response.text
    except Exception as e:
        print(f"AI Error: {e}")
        return "Shanti. Look within."

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_text = data.get('text')
    language = data.get('language', 'en') # Defaults to 'en' if not sent
    
    if not user_text:
        return jsonify({"error": "No text provided"}), 400

    # 1. Get Text Reply from Gemini
    reply_text = get_krishna_response(user_text, language)

    # 2. Select the correct Male Voice
    selected_voice = VOICE_HI if language == 'hi' else VOICE_EN

    # 3. Generate Audio (Async)
    try:
        # We use asyncio.run because Flask runs synchronously
        audio_base64 = asyncio.run(generate_audio_edge(reply_text, selected_voice))
    except Exception as e:
        print(f"Audio Generation Error: {e}")
        audio_base64 = None

    return jsonify({
        "reply": reply_text,
        "audio": audio_base64
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)