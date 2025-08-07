import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import conversation

app = FastAPI()

# Supabase URL and Key are fetched from environment variables.
# This is crucial for Render deployment.
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# This middleware is required to allow the frontend to communicate with the backend.
# The URL should match the address of your deployed frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Replace with your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your API routers.
app.include_router(conversation.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the LeadSpark backend API."}

