import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types (based on your schema)
export interface Lead {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  investment_goals?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  notes?: string;
  last_contacted?: string;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  lead_id: string;
  transcript_json: any;
  duration_seconds?: number;
  message_count?: number;
  lead_captured: boolean;
  created_at: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  type: 'document' | 'url' | 'text';
  url?: string;
  file_path?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  config_json: {
    system_prompt?: string;
    elevenlabs_voice?: string;
    notification_emails?: string[];
    calendar_id?: string;
    llm_consensus_enabled?: boolean;
    llm_consensus_strategy?: string;
    widget_settings?: {
      primary_color?: string;
      avatar_image?: string;
      position?: 'bottom-right' | 'bottom-left';
    };
  };
  stripe_customer_id?: string;
  subscription_status: 'active' | 'trialing' | 'canceled' | 'incomplete';
  current_plan_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  tenant_id: string;
  role: 'superadmin' | 'client';
  created_at: string;
}

// Helper functions for common database operations
export const dbHelpers = {
  // Leads
  async getLeads(tenantId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Lead[];
  },

  async getLead(leadId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data as Lead;
  },

  async deleteKnowledgeBaseEntry(tenantId: string, id: string) {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);
    if (error) throw error;
  },





  async updateLeadStatus(leadId: string, status: Lead['status'], tenantId: string) {
    const { data, error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  // Conversations
  async getConversationsForLead(leadId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', leadId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Conversation[];
  },

  // Knowledge Base
  async getKnowledgeBase(tenantId: string) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as KnowledgeBaseEntry[];
  },

  async createKnowledgeBaseEntry(entry: Omit<KnowledgeBaseEntry, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeBaseEntry;
  },

  // Tenant Configuration
  async getTenantConfig(tenantId: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) throw error;
    return data as Tenant;
  },

  async updateTenantConfig(tenantId: string, config: Partial<Tenant['config_json']>) {
    const { data, error } = await supabase
      .from('tenants')
      .update({
        config_json: config,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data as Tenant;
  },

  // Analytics
  async getDashboardStats(tenantId: string) {
    // Get total leads count
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get this week's leads
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { count: weekLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', oneWeekAgo.toISOString());

    // Get converted leads
    const { count: convertedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'converted');

    return {
      totalLeads: totalLeads || 0,
      weekLeads: weekLeads || 0,
      convertedLeads: convertedLeads || 0,
    };
  },
};

export default supabase;

