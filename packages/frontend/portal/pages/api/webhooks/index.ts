import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    switch (type) {
      case 'stripe.webhook':
        await handleStripeWebhook(data);
        break;

      case 'supabase.webhook':
        await handleSupabaseWebhook(data);
        break;

      case 'conversation.completed':
        await handleConversationCompleted(data);
        break;

      case 'lead.captured':
        await handleLeadCaptured(data);
        break;

      default:
        console.warn('Unknown webhook type:', type);
        return res.status(400).json({ error: 'Unknown webhook type' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle Stripe webhook events
async function handleStripeWebhook(data: any) {
  const { event_type, customer_id, subscription_status, plan_id } = data;

  try {
    switch (event_type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await supabase
          .from('tenants')
          .update({
            subscription_status,
            current_plan_id: plan_id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customer_id);
        break;

      case 'customer.subscription.deleted':
        await supabase
          .from('tenants')
          .update({
            subscription_status: 'canceled',
            current_plan_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customer_id);
        break;

      case 'invoice.payment_failed':
        // Handle payment failures - maybe send notification
        await notifyPaymentFailure(customer_id);
        break;
    }
  } catch (error) {
    console.error('Stripe webhook error:', error);
    throw error;
  }
}

// Handle Supabase webhook events (database changes)
async function handleSupabaseWebhook(data: any) {
  const { table, record, old_record, type } = data;

  try {
    switch (table) {
      case 'leads':
        if (type === 'INSERT') {
          await notifyNewLead(record);
        } else if (type === 'UPDATE' && record.status !== old_record.status) {
          await notifyLeadStatusChange(record, old_record);
        }
        break;

      case 'conversations':
        if (type === 'INSERT') {
          await processNewConversation(record);
        }
        break;
    }
  } catch (error) {
    console.error('Supabase webhook error:', error);
    throw error;
  }
}

// Handle completed conversation from widget/backend
async function handleConversationCompleted(data: any) {
  const {
    conversation_id,
    tenant_id,
    lead_id,
    transcript,
    duration_seconds,
    message_count,
    lead_captured
  } = data;

  try {
    // Save conversation analytics
    await supabase.from('conversation_analytics').insert({
      tenant_id,
      conversation_id,
      duration_seconds,
      message_count,
      lead_captured
    });

    // Update lead with last contacted timestamp
    if (lead_id) {
      await supabase
        .from('leads')
        .update({
          last_contacted: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lead_id)
        .eq('tenant_id', tenant_id);
    }

    // Notify tenant of conversation completion
    await notifyConversationCompleted(tenant_id, conversation_id);
  } catch (error) {
    console.error('Conversation completion error:', error);
    throw error;
  }
}

// Handle new lead captured from widget
async function handleLeadCaptured(data: any) {
  const { tenant_id, lead_data, conversation_id } = data;

  try {
    // Insert the new lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        tenant_id,
        first_name: lead_data.first_name,
        last_name: lead_data.last_name,
        email: lead_data.email,
        phone: lead_data.phone,
        investment_goals: lead_data.investment_goals,
        source: lead_data.source || 'widget',
        status: 'new'
      })
      .select()
      .single();

    if (error) throw error;

    // Link conversation to lead if provided
    if (conversation_id && lead) {
      await supabase
        .from('conversations')
        .update({ lead_id: lead.id })
        .eq('id', conversation_id)
        .eq('tenant_id', tenant_id);
    }

    // Notify tenant of new lead
    await notifyNewLead(lead);
  } catch (error) {
    console.error('Lead capture error:', error);
    throw error;
  }
}

// Notification helper functions
async function notifyNewLead(lead: any) {
  // Get tenant notification settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('config_json')
    .eq('id', lead.tenant_id)
    .single();

  const notificationEmails = tenant?.config_json?.notification_emails || [];

  // Send email notifications (implement with your email service)
  for (const email of notificationEmails) {
    await sendEmail({
      to: email,
      subject: `New Lead: ${lead.first_name} ${lead.last_name}`,
      template: 'new-lead',
      data: lead
    });
  }
}

async function notifyLeadStatusChange(newRecord: any, oldRecord: any) {
  // Implement lead status change notifications
  console.log(`Lead ${newRecord.id} status changed from ${oldRecord.status} to ${newRecord.status}`);
}

async function notifyPaymentFailure(customerId: string) {
  // Implement payment failure notifications
  console.log(`Payment failed for customer: ${customerId}`);
}

async function notifyConversationCompleted(tenantId: string, conversationId: string) {
  // Implement conversation completion notifications
  console.log(`Conversation ${conversationId} completed for tenant ${tenantId}`);
}

async function processNewConversation(conversation: any) {
  // Process new conversation data, extract insights, etc.
  console.log(`New conversation processed: ${conversation.id}`);
}

async function sendEmail(options: {
  to: string;
  subject: string;
  template: string;
  data: any;
}) {
  // Implement email sending logic with your preferred service
  // (SendGrid, AWS SES, Postmark, etc.)
  console.log('Email would be sent:', options);
}