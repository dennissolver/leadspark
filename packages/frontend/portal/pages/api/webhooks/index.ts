// File: packages/frontend/portal/pages/api/webhooks/index.ts

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Webhook received:', req.body);
    return res.status(200).json({ received: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
}