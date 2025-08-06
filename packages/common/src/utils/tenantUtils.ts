// File: packages/common/src/utils/tenantUtils.ts

import type { Tenant } from '../types';

export function getTenantDomain(tenant: Tenant): string {
  return `${tenant.domain}.base44.app`;
}

export function isProPlan(tenant: Tenant): boolean {
  return tenant.plan === 'pro' || tenant.plan === 'enterprise';
}

export function canAccessFeature(tenant: Tenant, feature: string): boolean {
  const proFeatures = ['lead-export', 'agent-tuning'];
  return tenant.plan === 'enterprise' || (tenant.plan === 'pro' && proFeatures.includes(feature));
}