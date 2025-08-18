# ============================================================================
# DEPLOYMENT REQUIREMENTS & ACTIONS CHECKLIST
# ============================================================================

# 1. INSTALL ADDITIONAL PYTHON DEPENDENCIES
pip install httpx websockets

# Add to requirements.txt:
echo "httpx>=0.25.0" >> requirements.txt
echo "websockets>=11.0" >> requirements.txt

# 2. CREATE DIRECTORY STRUCTURE
mkdir -p models/
mkdir -p routes/

# 3. FILE CREATION CHECKLIST
# ✅ NEW FILES TO CREATE:
# - models/consensus_models.py
# - services/async_consensus_handler.py
# - services/async_consensus_processor.py
# - routes/consensus_routes.py

# ✅ FILES TO UPDATE:
# - services/supabase_service.py (add async consensus methods)
# - services/notification_service.py (add WebSocket support)
# - main.py (add WebSocket endpoint and consensus routes)

# 4. DATABASE SETUP
# Run the SQL script in your Supabase SQL Editor:
# - Creates consensus_requests table
# - Creates consensus_logs table
# - Adds missing columns to conversations table
# - Sets up indexes and RLS policies
# - Creates performance monitoring views

# 5. ENVIRONMENT VARIABLES (Optional additions to .env)
cat >> .env << 'EOF'

# WebSocket Configuration
WEBSOCKET_ENABLED=true
WEBSOCKET_PING_INTERVAL=30

# Consensus Service Configuration
CONSENSUS_MAX_CONCURRENT=10
CONSENSUS_DEFAULT_TIMEOUT=120
CONSENSUS_ENABLE_PROGRESS_UPDATES=true

# Notification Configuration
NOTIFICATION_WEBHOOK_URL=https://your-app.com/api/webhooks/consensus
SLACK_WEBHOOK_URL=your_slack_webhook_url_here

EOF

# 6. UPDATE IMPORTS IN EXISTING FILES
# In your existing routes, add:
# from routes.consensus_routes import router as consensus_router
# app.include_router(consensus_router)

# 7. TEST THE SETUP
echo "Testing async consensus setup..."

# Test 1: Check database tables
python -c "
import asyncio
from services.supabase_service import SupabaseService

async def test_db():
    service = SupabaseService()
    result = await service.test_connection()
    print('Database connection:', '✅ OK' if result else '❌ Failed')

asyncio.run(test_db())
"

# Test 2: Check consensus service
python -c "
from services.llm_consensus_service import LLMConsensusService
service = LLMConsensusService()
models = list(service._model_agents.keys())
print(f'Available models: {models}')
print(f'Model count: {len(models)}')
"

# Test 3: Test individual imports
python -c "
try:
    from models.consensus_models import ConsensusRequest
    print('✅ Models import OK')
except ImportError as e:
    print(f'❌ Models import failed: {e}')
"

python -c "
try:
    from services.async_consensus_handler import AsyncConsensusHandler
    print('✅ Handler import OK')
except ImportError as e:
    print(f'❌ Handler import failed: {e}')
"

python -c "
try:
    from routes.consensus_routes import router
    print('✅ Routes import OK')
except ImportError as e:
    print(f'❌ Routes import failed: {e}')
"

# 8. START THE APPLICATION
echo "Starting FastAPI application..."
# uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 9. TEST ENDPOINTS
echo "Testing endpoints..."

# Test health check
curl -X GET "http://localhost:8000/health" | jq '.'

# Test WebSocket (requires wscat: npm install -g wscat)
# wscat -c ws://localhost:8000/ws/test-user-123

# Test consensus submission (requires user authentication)
# curl -X POST "http://localhost:8000/api/consensus/submit" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
#   -d '{
#     "prompt": "Test consensus request",
#     "task_type": "qualification",
#     "strategy": "weighted",
#     "priority": "normal"
#   }' | jq '.'

# 10. MONITORING AND LOGS
echo "Setting up monitoring..."

# View logs in real-time
# tail -f *.log

# Monitor queue status
# curl -X GET "http://localhost:8000/api/consensus/queue/status" | jq '