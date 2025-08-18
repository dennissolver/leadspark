from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
from utils.tenant_utils import get_tenant_id

logger = logging.getLogger(__name__)


class TenantAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            logger.debug(f"Processing request: {request.url}")

            # Skip tenant check for certain endpoints
            skip_paths = ["/health", "/", "/docs", "/redoc", "/openapi.json"]
            if any(str(request.url.path).startswith(path) for path in skip_paths):
                logger.debug(f"Skipping tenant auth for path: {request.url.path}")
                response = await call_next(request)
                return response

            # Get tenant_id - NOW PROPERLY AWAIT THE ASYNC FUNCTION
            tenant_id = await get_tenant_id(request)

            # Add tenant_id to request state for use in route handlers
            request.state.tenant_id = tenant_id
            logger.debug(f"Request processed with tenant_id: {tenant_id}")

            response = await call_next(request)
            return response

        except Exception as e:
            logger.error(f"Middleware error: {e}")
            # For non-critical errors, allow request to continue with default tenant
            request.state.tenant_id = "default"
            response = await call_next(request)
            return response