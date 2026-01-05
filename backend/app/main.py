from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
import edge_tts
import base64
import tempfile
import asyncio
import re
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS
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
    print("⚠️ WARNING: GOOGLE_API_KEY not found in environment variables!")

genai.configure(api_key=api_key)

# 🚀 UPDATED MODEL NAME: gemini-1.5-flash (Faster & Newer)
model = genai.GenerativeModel('gemini-1.5-flash')

# Import the Prompt
try:
    from app.prompt import KRISHNA_SYSTEM_PROMPT
except ImportError:
    KRISHNA_SYSTEM_PROMPT = "You are Krishna. Answer with wisdom."

# Chat History (Simple in-memory)
chat_history = []

class ChatRequest(BaseModel):
    text: str

def is_hindi(text):
    # Check for Devanagari characters
    return bool(re.search(r'[\u0900-\u097F]', text))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # 1. Get Answer from Gemini
        history_context = "\n".join([f"{msg['role']}: {msg['text']}" for msg in chat_history[-4:]])
        full_prompt = f"{KRISHNA_SYSTEM_PROMPT}\n\nRecent Chat:\n{history_context}\nUser: {request.text}\nKrishna:"
        
        response = model.generate_content(full_prompt)
        reply_text = response.text
        
        # Save to history
        chat_history.append({"role": "User", "text": request.text})
        chat_history.append({"role": "Krishna", "text": reply_text})

        # 2. Generate Audio (Edge TTS)
        # Voices: 'en-IN-PrabhatNeural' (Indian English Male)
        #         'hi-IN-MadhurNeural' (Hindi Male)
        
        voice = "en-IN-PrabhatNeural" # Default Male English
        if is_hindi(reply_text):
            voice = "hi-IN-MadhurNeural" # Default Male Hindi

        communicate = edge_tts.Communicate(reply_text, voice)
        
        # Create a temporary file to store the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_filename = temp_audio.name
            
        await communicate.save(temp_filename)

        # Read the file and convert to Base64
        with open(temp_filename, "rb") as audio_file:
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
        # Clean up temp file
        os.remove(temp_filename)

        return {
            "reply": reply_text, 
            "audio": audio_base64 
        }

    except Exception as e:
        print(f"Error: {e}")
        # Return a polite error if Google fails, but keep the app running
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"message": "Krishna Brain is Running with Gemini 1.5 Flash 🕉️"}