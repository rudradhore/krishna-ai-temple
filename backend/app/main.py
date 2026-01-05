from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
import edge_tts
import base64
import tempfile
import asyncio
import re
import uuid
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Gemini
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("⚠️ WARNING: GOOGLE_API_KEY not found!")

genai.configure(api_key=api_key)

# ---------------------------------------------------------
# 🧠 SMART MODEL SELECTOR (Updated for Gemini 2.5)
# ---------------------------------------------------------
model = None

def setup_model():
    global model
    print("🔍 Hunting for a working Google Model...")
    try:
        # 1. Ask Google what models are available
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        print(f"📋 Available Models found: {available_models}")

        # 2. Try to pick the best one
        chosen_model_name = None
        
        # 🚀 UPDATED PRIORITY LIST based on your logs
        priorities = [
            'models/gemini-2.5-flash',       # First Choice (Newest/Fastest)
            'models/gemini-2.0-flash',       # Second Choice
            'models/gemini-flash-latest',    # Safe Alias
            'models/gemini-2.5-pro',         # Powerful Backup
            'models/gemini-pro'              # Old Backup
        ]
        
        # Check if any priority model exists in the available list
        for p in priorities:
            if p in available_models:
                chosen_model_name = p
                break
        
        # Fallback: Just take the first one available
        if not chosen_model_name and available_models:
            chosen_model_name = available_models[0]

        if chosen_model_name:
            print(f"✅ Selected Model: {chosen_model_name}")
            model = genai.GenerativeModel(chosen_model_name)
        else:
            print("❌ NO MODELS FOUND. Check your API Key billing/permissions.")
            model = None

    except Exception as e:
        print(f"❌ Error listing models: {e}")
        model = None

# Run setup immediately
setup_model()

# Safety Settings
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

try:
    from app.prompt import KRISHNA_SYSTEM_PROMPT
except ImportError:
    KRISHNA_SYSTEM_PROMPT = "You are Krishna. Answer with wisdom."

chat_history = []

class ChatRequest(BaseModel):
    text: str

def is_hindi(text):
    return bool(re.search(r'[\u0900-\u097F]', text))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    global model
    
    # Retry setup if model failed previously
    if not model:
        setup_model()
    
    if not model:
        raise HTTPException(status_code=500, detail="Server could not find a working Google AI Model. Check Server Logs.")

    try:
        # --- 1. GENERATE TEXT ---
        history_context = "\n".join([f"{msg['role']}: {msg['text']}" for msg in chat_history[-4:]])
        full_prompt = f"{KRISHNA_SYSTEM_PROMPT}\n\nRecent Chat:\n{history_context}\nUser: {request.text}\nKrishna:"
        
        response = model.generate_content(full_prompt, safety_settings=safety_settings)
        
        if not response.parts:
            return {"reply": "My mind is clouded. Please ask again.", "audio": None}
            
        reply_text = response.text
        
        chat_history.append({"role": "User", "text": request.text})
        chat_history.append({"role": "Krishna", "text": reply_text})

        # --- 2. GENERATE AUDIO (Edge TTS) ---
        audio_base64 = None
        try:
            # Male Voice Logic
            voice = "en-IN-PrabhatNeural"
            if is_hindi(reply_text):
                voice = "hi-IN-MadhurNeural"

            communicate = edge_tts.Communicate(reply_text, voice)
            temp_filename = f"/tmp/{uuid.uuid4()}.mp3"
            await communicate.save(temp_filename)

            with open(temp_filename, "rb") as audio_file:
                audio_bytes = audio_file.read()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
        except Exception as audio_error:
            print(f"⚠️ Audio Failed: {audio_error}")
            audio_base64 = None 

        return {
            "reply": reply_text, 
            "audio": audio_base64 
        }

    except Exception as e:
        print(f"❌ CRITICAL SERVER ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"message": "Krishna Brain Online (Gemini 2.5 Enabled) 🕉️"}