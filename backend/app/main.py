from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
import edge_tts
import base64
# ...existing code...
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

# 🔍 DIAGNOSTIC: Print available models to logs
try:
    print("🔍 Listing available Google Models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"   - {m.name}")
except Exception as e:
    print(f"⚠️ Could not list models: {e}")

# Use the standard Flash model
model = genai.GenerativeModel('gemini-1.5-flash')

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
    try:
        # --- 1. GENERATE TEXT ---
        history_context = "\n".join([f"{msg['role']}: {msg['text']}" for msg in chat_history[-4:]])
        full_prompt = f"{KRISHNA_SYSTEM_PROMPT}\n\nRecent Chat:\n{history_context}\nUser: {request.text}\nKrishna:"
        
        response = model.generate_content(full_prompt, safety_settings=safety_settings)
        
        if not response.parts:
            # Fallback if filtered
            return {"reply": "My mind is clouded. Please ask again.", "audio": None}
            
        reply_text = response.text
        
        chat_history.append({"role": "User", "text": request.text})
        chat_history.append({"role": "Krishna", "text": reply_text})

        # --- 2. GENERATE AUDIO ---
        audio_base64 = None
        try:
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
    return {"message": "Krishna Brain Online 🕉️"}