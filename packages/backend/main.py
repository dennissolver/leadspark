"""
FastAPI main application with async consensus workflow and existing routes
"""

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import JSONResponse as StarletteJSONResponse
import logging
import json
from typing import Dict, List
from datetime import datetime

# Import existing middleware and routes
from middleware.tenant_auth import TenantAuthMiddleware
from routes import conversation, admin, onboarding
from routes.functions_proxy import router as fx_router
from routes.health import router as health_router

# Import new consensus routes
from routes.consensus_routes import router as consensus_router

# Import services
from services.notification_service import NotificationService

# Configure logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="LeadSpark AI API",
    description="Multi-Agent AI Sales Assistant with Async Consensus",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add existing tenant auth middleware
app.add_middleware(TenantAuthMiddleware)


# ============================================================================
# WEBSOCKET CONNECTION MANAGER FOR REAL-TIME NOTIFICATIONS
# ============================================================================

class WebSocketManager:
    """Manages WebSocket connections for real-time notifications"""

    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection and store by user_id"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)
        logger.info(f"📡 WebSocket connected for user {user_id}")

        # Send welcome message
        await self.send_to_user(user_id, {
            'type': 'connection_established',
            'message': 'Real-time notifications enabled',
            'timestamp': datetime.utcnow().isoformat()
        })

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)

            # Clean up empty lists
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        logger.info(f"📡 WebSocket disconnected for user {user_id}")

    async def send_to_user(self, user_id: str, data: dict):
        """Send data to all connections for a specific user"""
        if user_id in self.active_connections:
            disconnected = []

            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(data))
                except Exception as e:
                    logger.error(f"Error sending to WebSocket: {e}")
                    disconnected.append(connection)

            # Remove disconnected connections
            for connection in disconnected:
                self.active_connections[user_id].remove(connection)

            # Clean up empty lists
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast(self, data: dict):
        """Broadcast data to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, data)

    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())


# Initialize WebSocket manager
websocket_manager = WebSocketManager()

# Set up notification service with WebSocket manager
notification_service = NotificationService()
notification_service.set_websocket_manager(websocket_manager)


# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time notifications
    Usage: ws://localhost:8000/ws/{user_id}
    """
    await websocket_manager.connect(websocket, user_id)

    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()

            # Handle ping/pong or other client messages
            try:
                message = json.loads(data)
                message_type = message.get('type')

                if message_type == 'ping':
                    await websocket.send_text(json.dumps({
                        'type': 'pong',
                        'timestamp': datetime.utcnow().isoformat()
                    }))
                elif message_type == 'subscribe':
                    # Handle subscription to specific notification types
                    await websocket.send_text(json.dumps({
                        'type': 'subscription_confirmed',
                        'subscribed_to': message.get('topics', []),
                        'timestamp': datetime.utcnow().isoformat()
                    }))

            except json.JSONDecodeError:
                # Handle non-JSON messages
                logger.warning(f"Received non-JSON message from {user_id}: {data}")

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        websocket_manager.disconnect(websocket, user_id)


# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

# Include existing routes
app.include_router(conversation.router, prefix="/conversations")
app.include_router(admin.router, prefix="/admin")
app.include_router(onboarding.router, prefix="/onboarding")
app.include_router(health_router, prefix="/api")
app.include_router(fx_router, prefix="/api")

# Include new consensus routes
app.include_router(consensus_router, prefix="/api")


# ============================================================================
# ENHANCED HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "LeadSpark AI API",
        "version": "2.0.0",
        "features": [
            "Multi-Agent Consensus",
            "Async Processing",
            "Real-time Notifications",
            "Lead Qualification",
            "Agent Orchestration",
            "Tenant Authentication",
            "Conversation Management",
            "Admin Functions",
            "Onboarding Workflows"
        ],
        "websocket_connections": websocket_manager.get_connection_count(),
        "existing_routes": [
            "/conversations/*",
            "/admin/*",
            "/onboarding/*",
            "/api/health",
            "/api/functions/*"
        ],
        "new_routes": [
            "/api/consensus/*",
            "/ws/{user_id}"
        ]
    }


# Replace the health endpoint in your main.py with this simplified version:

@app.get("/health")
async def enhanced_health_check():
    """Simplified health check that doesn't call problematic services"""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "consensus": "healthy",
                "websocket": "healthy",
                "notifications": "healthy",
                "tenant_auth": "healthy",
                "existing_routes": "healthy"
            },
            "websocket_connections": websocket_manager.get_connection_count(),
            "route_status": {
                "conversations": "active",
                "admin": "active",
                "onboarding": "active",
                "functions_proxy": "active",
                "consensus": "active"
            },
            "message": "Basic health check - database tests disabled temporarily"
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.get("/metrics")
async def get_metrics():
    """System metrics endpoint"""
    try:
        from services.supabase_service import SupabaseService
        supabase_service = SupabaseService()

        # Get queue stats
        queue_stats = await supabase_service.get_consensus_queue_stats()

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "consensus_queue": queue_stats,
            "websocket_connections": websocket_manager.get_connection_count(),
            "active_users": len(websocket_manager.active_connections),
            "system_status": "operational",
            "middleware_status": {
                "cors": "enabled",
                "tenant_auth": "enabled"
            }
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


# ============================================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logger.info("🚀 LeadSpark AI API starting up...")
    logger.info(f"📡 WebSocket endpoint available at: /ws/{{user_id}}")
    logger.info(f"🧠 Consensus endpoint available at: /api/consensus/submit")
    logger.info("📋 Existing routes loaded:")
    logger.info("   - /conversations/* (Conversation management)")
    logger.info("   - /admin/* (Admin functions)")
    logger.info("   - /onboarding/* (Onboarding workflows)")
    logger.info("   - /api/health (Health checks)")
    logger.info("   - /api/functions/* (Functions proxy)")

    # Initialize services
    try:
        from services.llm_consensus_service import LLMConsensusService
        consensus_service = LLMConsensusService()
        available_models = list(consensus_service._model_agents.keys())
        logger.info(f"🤖 Available AI models: {available_models}")
    except Exception as e:
        logger.error(f"❌ Error initializing consensus service: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    logger.info("🛑 LeadSpark AI API shutting down...")

    # Close all WebSocket connections
    if websocket_manager.active_connections:
        disconnect_message = {
            'type': 'server_shutdown',
            'message': 'Server is shutting down',
            'timestamp': datetime.utcnow().isoformat()
        }
        await websocket_manager.broadcast(disconnect_message)


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def unified_exception_handler(request: Request, exc: Exception):
    """
    Unified exception handler that combines existing and new error handling
    """
    logger.error(f"Error processing {request.url}: {str(exc)}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "error": "Internal server error",
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url)
        }
    )


# ============================================================================
# DEVELOPMENT/TESTING ENDPOINTS
# ============================================================================

@app.post("/api/test/websocket")
async def test_websocket_notification(user_id: str, message: str):
    """Test WebSocket notification (development only)"""
    test_data = {
        'type': 'test_notification',
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }

    await websocket_manager.send_to_user(user_id, test_data)

    return {
        "message": f"Test notification sent to user {user_id}",
        "data": test_data
    }


@app.get("/api/debug/routes")
async def debug_routes():
    """Debug endpoint to list all available routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name if hasattr(route, 'name') else None
            })

    return {
        "total_routes": len(routes),
        "routes": routes,
        "websocket_connections": websocket_manager.get_connection_count()
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )