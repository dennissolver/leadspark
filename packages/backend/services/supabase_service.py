from fastapi import Request, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import logging
from jose import jwt, JWTError, jwk
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)

# Load from root .env file
root_dir = Path(__file__).parent.parent.parent.parent  # Go up to LeadSpark root
env_path = root_dir / '.env'
load_dotenv(env_path)

# Get the variables FIRST
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# THEN print the debug info (remove these after testing)
print(f"Loading .env from: {env_path}")
print(f"SUPABASE_URL found: {supabase_url is not None}")
print(f"SUPABASE_KEY found: {supabase_key is not None}")

# Check if variables are present
if not supabase_url or not supabase_key:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in .env")
    raise ValueError("Missing Supabase configuration")

supabase: Client = create_client(supabase_url, supabase_key)
logger.debug("Supabase client initialized")

SUPABASE_JWKS_URL = f"{supabase_url}/auth/v1/.well-known/jwks.json"
_jwks_cache: Optional[Dict[str, Any]] = None


async def get_jwks() -> Dict[str, Any]:
    """Fetch JWKS from Supabase endpoint with caching"""
    global _jwks_cache
    if _jwks_cache is None:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(SUPABASE_JWKS_URL)
                response.raise_for_status()
                _jwks_cache = response.json()
                logger.info("JWKS fetched and cached successfully")
        except Exception as e:
            logger.error(f"Failed to fetch JWKS: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch authentication keys")
    return _jwks_cache


def get_signing_key(kid: str, jwks_data: Dict[str, Any]) -> str:
    """Extract the public key for the given key ID"""
    for key in jwks_data.get("keys", []):
        if key.get("kid") == kid:
            return jwk.construct(key).to_pem()
    raise ValueError(f"Unable to find key with kid: {kid}")


async def get_current_user(request: Request):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.error("No Authorization header provided")
            raise HTTPException(status_code=401, detail="Authorization header missing")
        if not auth_header.startswith("Bearer "):
            logger.error(f"Invalid Authorization header format: {auth_header}")
            raise HTTPException(status_code=401, detail="Invalid Authorization header")
        token = auth_header.replace("Bearer ", "")
        logger.debug(f"Validating token: {token[:10]}...")

        # Get unverified header to extract key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            logger.error("Token missing key ID (kid) in header")
            raise HTTPException(status_code=401, detail="Token missing key ID")

        # Fetch JWKS and validate token
        jwks_data = await get_jwks()
        signing_key = get_signing_key(kid, jwks_data)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            options={"verify_aud": False}
        )
        logger.debug(f"User validated: {payload.get('email')}")
        return type('User', (), {'id': payload.get('sub'), 'email': payload.get('email')})()
    except JWTError as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Unexpected error during token validation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CLASS-BASED SERVICE FOR CONSISTENCY WITH OTHER SERVICES
# ============================================================================

class SupabaseService:
    """
    Class wrapper around existing Supabase functional code
    Provides consistent interface for other services
    """

    def __init__(self):
        self.client = supabase
        self.logger = logger

    # Authentication methods
    async def get_current_user(self, request):
        """Get current authenticated user"""
        return await get_current_user(request)

    # Conversation methods
    async def create_conversation(self, conversation_data: Dict[str, Any]) -> str:
        """Create a new conversation record"""
        try:
            result = self.client.table('conversations').insert(conversation_data).execute()
            return result.data[0]['id']
        except Exception as e:
            self.logger.error(f"Error creating conversation: {e}")
            raise

    async def add_conversation_message(
            self,
            conversation_id: str,
            role: str,
            content: str,
            audio_url: Optional[str] = None,
            metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Add a message to a conversation"""
        try:
            message_data = {
                'conversation_id': conversation_id,
                'role': role,
                'content': content,
                'audio_url': audio_url,
                'metadata': metadata or {},
                'created_at': datetime.utcnow().isoformat()
            }

            result = self.client.table('conversation_messages').insert(message_data).execute()
            return result.data[0]['id']
        except Exception as e:
            self.logger.error(f"Error adding conversation message: {e}")
            raise

    async def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation message history"""
        try:
            result = self.client.table('conversation_messages') \
                .select('*') \
                .eq('conversation_id', conversation_id) \
                .order('created_at') \
                .execute()

            return result.data
        except Exception as e:
            self.logger.error(f"Error getting conversation history: {e}")
            return []

    async def update_conversation_status(
            self,
            conversation_id: str,
            status: str,
            **kwargs
    ) -> bool:
        """Update conversation status and additional fields"""
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat(),
                **kwargs
            }

            self.client.table('conversations') \
                .update(update_data) \
                .eq('id', conversation_id) \
                .execute()

            return True
        except Exception as e:
            self.logger.error(f"Error updating conversation status: {e}")
            return False

    async def update_conversation_qualification(
            self,
            conversation_id: str,
            qualification_data: Dict[str, Any]
    ) -> bool:
        """Update conversation qualification data"""
        try:
            update_data = {
                'qualification_data': qualification_data,
                'qualification_score': qualification_data.get('score', 0),
                'updated_at': datetime.utcnow().isoformat()
            }

            self.client.table('conversations') \
                .update(update_data) \
                .eq('id', conversation_id) \
                .execute()

            return True
        except Exception as e:
            self.logger.error(f"Error updating conversation qualification: {e}")
            return False

    async def add_conversation_summary(
            self,
            conversation_id: str,
            summary: str
    ) -> bool:
        """Add conversation summary"""
        try:
            update_data = {
                'summary': summary,
                'updated_at': datetime.utcnow().isoformat()
            }

            self.client.table('conversations') \
                .update(update_data) \
                .eq('id', conversation_id) \
                .execute()

            return True
        except Exception as e:
            self.logger.error(f"Error adding conversation summary: {e}")
            return False

    # Lead and tenant methods
    async def create_lead(self, lead_data: Dict[str, Any]) -> str:
        """Create a new lead record"""
        try:
            result = self.client.table('leads').insert(lead_data).execute()
            return result.data[0]['id']
        except Exception as e:
            self.logger.error(f"Error creating lead: {e}")
            raise

    async def get_conversations_for_period(
            self,
            tenant_id: str,
            period: str = '7d'
    ) -> List[Dict[str, Any]]:
        """Get conversations for a specific time period"""
        try:
            if period == '7d':
                days = 7
            elif period == '30d':
                days = 30
            elif period == '90d':
                days = 90
            else:
                days = 7

            start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

            result = self.client.table('conversations') \
                .select('*') \
                .eq('tenant_id', tenant_id) \
                .gte('created_at', start_date) \
                .execute()

            return result.data
        except Exception as e:
            self.logger.error(f"Error getting conversations for period: {e}")
            return []

    async def update_tenant_agent_config(
            self,
            tenant_id: str,
            config: Dict[str, Any]
    ) -> bool:
        """Update tenant agent configuration"""
        try:
            update_data = {
                'agent_config': config,
                'updated_at': datetime.utcnow().isoformat()
            }

            self.client.table('tenants') \
                .update(update_data) \
                .eq('id', tenant_id) \
                .execute()

            return True
        except Exception as e:
            self.logger.error(f"Error updating tenant agent config: {e}")
            return False

    # ============================================================================
    # NEW METHODS FOR ASYNC CONSENSUS WORKFLOW - FIXED
    # ============================================================================

    async def create_consensus_request(self, request_data: Dict[str, Any]) -> str:
        """Create a new consensus request"""
        try:
            result = self.client.table('consensus_requests').insert(request_data).execute()
            return result.data[0]['id']
        except Exception as e:
            self.logger.error(f"Error creating consensus request: {e}")
            raise

    async def get_consensus_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get consensus request by ID"""
        try:
            result = self.client.table('consensus_requests') \
                .select('*') \
                .eq('id', request_id) \
                .single() \
                .execute()

            return result.data
        except Exception as e:
            self.logger.error(f"Error getting consensus request {request_id}: {e}")
            return None

    async def update_consensus_request_status(
            self,
            request_id: str,
            status: str,
            error: Optional[str] = None,
            result: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update consensus request status"""
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            }

            if error:
                update_data['error'] = error

            if result:
                update_data['result'] = result

            self.client.table('consensus_requests') \
                .update(update_data) \
                .eq('id', request_id) \
                .execute()

            return True
        except Exception as e:
            self.logger.error(f"Error updating consensus request status: {e}")
            return False

    async def store_consensus_result(self, request_id: str, result_data: Dict[str, Any]) -> bool:
        """Store final consensus result"""
        try:
            update_data = {
                'result': result_data,
                'status': result_data.get('status', 'completed'),
                'updated_at': datetime.utcnow().isoformat()
            }

            self.client.table('consensus_requests') \
                .update(update_data) \
                .eq('id', request_id) \
                .execute()

            return True
        except Exception as e:
            self.logger.error(f"Error storing consensus result: {e}")
            return False

    async def count_pending_consensus_requests(self, priority: str = 'normal') -> int:
        """Count pending consensus requests - FIXED"""
        try:
            result = self.client.table('consensus_requests') \
                .select('*', count='exact') \
                .in_('status', ['pending', 'queued', 'processing']) \
                .execute()

            # Access count directly, not with .get()
            return result.count if result.count is not None else 0

        except Exception as e:
            self.logger.error(f"Error counting pending requests: {e}")
            return 0

    async def get_user_consensus_history(
            self,
            user_id: str,
            limit: int = 20,
            offset: int = 0,
            status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get user's consensus request history"""
        try:
            query = self.client.table('consensus_requests') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True) \
                .range(offset, offset + limit - 1)

            if status:
                query = query.eq('status', status)

            result = query.execute()
            return result.data
        except Exception as e:
            self.logger.error(f"Error getting user consensus history: {e}")
            return []

    async def get_consensus_queue_stats(self) -> Dict[str, Any]:
        """Get consensus processing queue statistics - FIXED"""
        try:
            # Use the view we created in SQL instead of complex queries
            result = self.client.table('consensus_queue_stats') \
                .select('*') \
                .execute()

            if result.data and len(result.data) > 0:
                stats = result.data[0]
                return {
                    'total_pending': stats.get('total_pending', 0),
                    'currently_processing': stats.get('currently_processing', 0),
                    'total_completed': stats.get('total_completed', 0),
                    'total_failed': stats.get('total_failed', 0),
                    'avg_processing_time_seconds': stats.get('avg_processing_time_seconds'),
                    'last_completed_at': stats.get('last_completed_at')
                }
            else:
                # Fallback if view doesn't work
                return {
                    'total_pending': 0,
                    'currently_processing': 0,
                    'total_completed': 0,
                    'total_failed': 0,
                    'avg_processing_time_seconds': None,
                    'last_completed_at': None
                }

        except Exception as e:
            self.logger.error(f"Error getting queue stats: {e}")
            return {
                'total_pending': 0,
                'currently_processing': 0,
                'total_completed': 0,
                'total_failed': 0,
                'avg_processing_time_seconds': None,
                'last_completed_at': None
            }

    # Consensus logging methods
    async def log_consensus_decision(self, log_data: Dict[str, Any]) -> bool:
        """Log consensus decision for analysis"""
        try:
            self.client.table('consensus_logs').insert(log_data).execute()
            return True
        except Exception as e:
            self.logger.error(f"Error logging consensus decision: {e}")
            return False

    # Utility methods
    def get_database_url(self) -> str:
        """Get database URL for external integrations"""
        return supabase_url

    async def test_connection(self) -> bool:
        """Test database connection - SIMPLIFIED"""
        try:
            # Simple query that should always work
            result = self.client.table('consensus_requests') \
                .select('id') \
                .limit(1) \
                .execute()

            # Just check if we got a response without accessing .data
            return True

        except Exception as e:
            self.logger.error(f"Database connection test failed: {e}")
            return False

    # Additional methods that might be called by other services
    async def get_tenant_config(self, tenant_id: str) -> Dict[str, Any]:
        """Get tenant configuration"""
        try:
            result = self.client.table('tenants') \
                .select('*') \
                .eq('id', tenant_id) \
                .single() \
                .execute()

            return result.data
        except Exception as e:
            self.logger.error(f"Error getting tenant config: {e}")
            return {}

    async def update_conversation_metadata(
            self,
            conversation_id: str,
            metadata: Dict[str, Any]
    ) -> bool:
        """Update conversation metadata"""
        try:
            self.client.table('conversations') \
                .update({'metadata': metadata}) \
                .eq('id', conversation_id) \
                .execute()

            return True
        except Exception as e:
            self.logger.error(f"Error updating conversation metadata: {e}")
            return False