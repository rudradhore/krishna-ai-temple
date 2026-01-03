from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# --- 1. CONFIGURATION ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("⚠️ WARNING: Google API Key not found in .env file!")

genai.configure(api_key=GOOGLE_API_KEY)

# --- SMART MODEL SELECTION ---
# This block automatically finds a working model for your key
valid_model_name = "gemini-1.5-flash" # Default fallback
try:
    print("🔍 Searching for available AI models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            if 'gemini' in m.name:
                valid_model_name = m.name
                print(f"✅ Found working model: {valid_model_name}")
                break
except Exception as e:
    print(f"⚠️ Could not list models (using default): {e}")

# Initialize the Brain with the found name
model = genai.GenerativeModel(valid_model_name)

from app.prompt import KRISHNA_SYSTEM_PROMPT

# --- 2. APP SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserQuery(BaseModel):
    text: str

# --- 3. THE CHAT ENDPOINT ---
@app.post("/chat")
async def chat(query: UserQuery):
    print(f"User asked: {query.text}")
    try:
        full_prompt = f"{KRISHNA_SYSTEM_PROMPT}\nUser: {query.text}"
        response = model.generate_content(full_prompt)
        return {"reply": response.text}
    except Exception as e:
        print(f"Error details: {e}")
        return {"reply": f"My connection is faint. Error: {str(e)}"}