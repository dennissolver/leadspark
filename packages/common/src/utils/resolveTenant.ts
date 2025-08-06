// File: packages/common/src/utils/resolveTenant.ts

export function getSubdomain(host: string): string | null {
  if (!host.endsWith('.corporateaisolutions.com')) return null;
  const parts = host.split('.');
  if (parts.length < 3) return null;
  return parts[0]; // e.g. 'propertyfriends'
}