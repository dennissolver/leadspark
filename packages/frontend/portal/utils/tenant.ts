// This file centralizes the logic for getting the tenant ID from the user object.
// This prevents duplication and makes it easier to change the logic in one place.

// It's assumed the 'user' object is a Supabase Auth user object.
const getTenantId = (user: any): string | undefined => {
  if (!user) {
    return undefined;
  }
  return user.user_metadata?.tenant_id ?? user.app_metadata?.tenant_id ?? user.tenant_id;
};

export { getTenantId };
