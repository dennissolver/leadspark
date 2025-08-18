// packages/frontend/admin-portal/hooks/useRealtimeTenants.ts
import { useState, useEffect } from "react";
import { useSupabase } from "@leadspark/common/supabase";

type Tenant = {
  id: string;
  name: string;
  subscriptionStatus: string;
  leadCount: number;
};

export const useRealtimeTenants = (initialTenants: Tenant[], supabase: any) => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);

  useEffect(() => {
    // Subscribe to real-time updates on the tenants table
    const channel = supabase
      .channel("tenants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenants",
        },
        async (payload) => {
          const { eventType, new: newTenant, old: oldTenant } = payload;
          setTenants((currentTenants) => {
            switch (eventType) {
              case "INSERT":
                return [...currentTenants, newTenant];
              case "UPDATE":
                return currentTenants.map((tenant) =>
                  tenant.id === newTenant.id ? { ...newTenant, leadCount: newTenant.leads?.length || 0 } : tenant
                );
              case "DELETE":
                return currentTenants.filter((tenant) => tenant.id !== oldTenant.id);
              default:
                return currentTenants;
            }
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { tenants };
};
