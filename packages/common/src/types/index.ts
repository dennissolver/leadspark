// File: packages/common/src/types/index.ts

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  tenantId: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  investment_goals: string;
  tenantId: string;
  created_at: string;
}