// pages/api/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

interface CreateCheckoutRequest {
  priceId: string;
  userId: string;
  email: string;
  companyName: string;
  plan: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { priceId, userId, email, companyName, plan }: CreateCheckoutRequest = req.body;

    // Validate required fields
    if (!priceId || !userId || !email || !companyName || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.origin}/signup?canceled=true`,
      customer_email: email,
      metadata: {
        userId,
        companyName,
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          companyName,
          plan,
        },
        trial_period_days: 14, // 14-day free trial
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({
      sessionId: session.id
    });

  } catch (error) {
    console.error('Stripe checkout session creation error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: `Stripe error: ${error.message}`
      });
    }

    return res.status(500).json({
      error: 'Failed to create checkout session'
    });
  }
}