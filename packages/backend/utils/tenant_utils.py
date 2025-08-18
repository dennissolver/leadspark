import logging
from fastapi import Request
from services.supabase_service import get_current_user

logger = logging.getLogger(__name__)


async def get_tenant_id(request: Request) -> str:
    """Extract tenant_id from request headers, query params, or user metadata"""
    try:
        # Check headers first
        tenant_id = request.headers.get("x-tenant-id")
        if tenant_id:
            logger.debug(f"Found tenant_id in headers: {tenant_id}")
            return tenant_id

        # Check query parameters
        tenant_id = request.query_params.get("tenant_id")
        if tenant_id:
            logger.debug(f"Found tenant_id in query params: {tenant_id}")
            return tenant_id

        logger.debug("No tenant_id in header/query, checking user metadata")

        # Try to get from user metadata - AWAIT the async function
        try:
            user = await get_current_user(request)
            tenant_id = user.get("user_metadata", {}).get("tenant_id") if user else None
            if tenant_id:
                logger.debug(f"Found tenant_id in user metadata: {tenant_id}")
                return tenant_id
        except Exception as auth_error:
            # User might not be authenticated - that's okay for some endpoints
            logger.debug(f"Could not get user info (not authenticated): {auth_error}")
            pass

        # Default tenant for unauthenticated requests
        default_tenant = "default"
        logger.debug(f"Using default tenant_id: {default_tenant}")
        return default_tenant

    except Exception as e:
        logger.error(f"Error in get_tenant_id: {e}")
        # Return default instead of failing
        return "default"