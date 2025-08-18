// packages/frontend/admin-portal/hooks/useRealtimeLeads.ts
import { useState, useEffect } from "react";
import { useSupabase } from "@leadspark/common/supabase";

type Lead = {
  id: string;
  tenantId: string;
  createdAt: string;
  // Add other fields as needed (e.g., status, source)
};

export const useRealtimeLeads = (initialLeads: Lead[], supabase: any) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  useEffect(() => {
    // Subscribe to real-time updates on the leads table
    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const { eventType, new: newLead, old: oldLead } = payload;
          setLeads((currentLeads) => {
            switch (eventType) {
              case "INSERT":
                return [...currentLeads, newLead];
              case "UPDATE":
                return currentLeads.map((lead) =>
                  lead.id === newLead.id ? newLead : lead
                );
              case "DELETE":
                return currentLeads.filter((lead) => lead.id !== oldLead.id);
              default:
                return currentLeads;
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

  return { leads };
};
