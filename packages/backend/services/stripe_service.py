# packages/backend/services/stripe_service.py
from fastapi import HTTPException
import stripe
import os
import logging

logger = logging.getLogger(__name__)

# It's critical to load these from your environment variables, not hardcode them.
# The project plan specifies these should be set in Render's dashboard.
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


async def create_checkout_session(tenant_id: str, plan: str):
    """
    Creates a new Stripe Checkout Session for a given tenant and subscription plan.

    Args:
        tenant_id: The unique ID of the tenant.
        plan: The subscription plan (e.g., 'pro_monthly', 'pro_annual').

    Returns:
        A dictionary containing the Stripe session ID and the tenant ID.

    Raises:
        HTTPException: If the Stripe session creation fails.
    """
    try:
        # Define a price ID based on the plan. This should correspond to a Price
        # object you've created in your Stripe Dashboard.
        price_id = os.getenv(f"STRIPE_PRICE_ID_{plan.upper()}")

        if not price_id:
            logger.error(f"Stripe price ID not found for plan: {plan}")
            raise HTTPException(
                status_code=500,
                detail=f"Stripe configuration error: Price ID for plan '{plan}' not found."
            )

        # Retrieve the Vercel URLs from environment variables
        success_url = os.getenv("VERCEL_SUCCESS_URL")
        cancel_url = os.getenv("VERCEL_CANCEL_URL")

        if not success_url or not cancel_url:
            logger.error("Vercel redirect URLs not found in environment variables.")
            raise HTTPException(
                status_code=500,
                detail="Vercel URLs not configured properly."
            )

        # Create the Stripe Checkout Session
        session = stripe.checkout.Session.create(
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            # Use the environment variables for the redirect URLs
            success_url=f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=cancel_url,
            # Pass the tenant_id in the session metadata.
            # This is crucial for the webhook handler to identify the tenant.
            metadata={
                'tenant_id': tenant_id
            },
        )
        logger.info(f"Stripe checkout session created for tenant {tenant_id}.")

        return {"session_id": session.id, "tenant_id": tenant_id}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe API error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Stripe session failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Stripe session failed: {str(e)}")

