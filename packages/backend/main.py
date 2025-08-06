from fastapi import FastAPI
from routes.conversation import router as conversation_router

app = FastAPI(title="LeadSpark AI Backend")

app.include_router(conversation_router, prefix="/api/conversation")