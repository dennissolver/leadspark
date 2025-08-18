// packages/frontend/admin-portal/pages/dashboard.tsx
import React, { useMemo, useState, createContext, useContext } from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { createServerClient } from "@supabase/ssr";
import { serialize } from "cookie";


// Try to import everything from your UI kit once:
import * as UI from "@leadspark/ui";

// Local deps remain the same
import { useSupabase } from "@leadspark/common/supabase";
import { AnalyticsChart as AnalyticsChartFromUI } from "@leadspark/ui/AnalyticsChart"; // keep if it exists
import { TenantForm as TenantFormFromLocal } from "../components/TenantForm";
import { useRealtimeTenants } from "../hooks/useRealtimeTenants";
import { useRealtimeLeads } from "../hooks/useRealtimeLeads";

/** ---------- SAFE FALLBACKS ---------- */

// Minimal Card primitives
const Card       = (UI as any)?.Card       ?? ((p: any) => <div className={"rounded border bg-white " + (p.className ?? "")}>{p.children}</div>);
const CardHeader = (UI as any)?.CardHeader ?? ((p: any) => <div className={"p-4 border-b " + (p.className ?? "")}>{p.children}</div>);
const CardTitle  = (UI as any)?.CardTitle  ?? ((p: any) => <h3 className={"font-semibold " + (p.className ?? "")}>{p.children}</h3>);
const CardContent= (UI as any)?.CardContent?? ((p: any) => <div className={"p-4 " + (p.className ?? "")}>{p.children}</div>);
const Button     = (UI as any)?.Button     ?? (({ className="", ...p }: any) => <button className={"px-3 py-1.5 border rounded " + className} {...p} />);

// Minimal Tabs implementation that mirrors the API used on the page
type TabsCtxType = { value: string; setValue: (v: string) => void };
const TabsCtx = createContext<TabsCtxType | null>(null);

const LocalTabs = ({ defaultValue, children }: any) => {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
};
const LocalTabsList = ({ children }: any) => <div className="mb-4 flex gap-2 border-b">{children}</div>;
const LocalTabsTrigger = ({ value, children }: any) => {
  const ctx = useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={"px-3 py-2 -mb-px " + (active ? "border-b-2 font-medium" : "opacity-70")}
    >
      {children}
    </button>
  );
};
const LocalTabsContent = ({ value, children }: any) => {
  const ctx = useContext(TabsCtx)!;
  return ctx.value === value ? <div>{children}</div> : null;
};

// Use library Tabs if present, else fall back to locals
const Tabs        = (UI as any)?.Tabs        ?? LocalTabs;
const TabsList    = (UI as any)?.TabsList    ?? LocalTabsList;
const TabsTrigger = (UI as any)?.TabsTrigger ?? LocalTabsTrigger;
const TabsContent = (UI as any)?.TabsContent ?? LocalTabsContent;

// Minimal DataTable fallback (supports columns with accessor and optional cell renderer)
const DataTable =
  (UI as any)?.DataTable ??
  (({ data = [], columns = [] }: any) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((c: any) => (
              <th key={c.accessor} className="text-left p-2 border-b">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data || []).map((row: any, i: number) => (
            <tr key={row.id ?? i} className="odd:bg-gray-50">
              {columns.map((c: any) => (
                <td key={c.accessor} className="p-2 border-b align-top">
                  {typeof c.cell === "function" ? c.cell({ row }) : (row as any)[c.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ));

// Chart + TenantForm: try UI/local first, else safe fallbacks
const AnalyticsChart =
  (AnalyticsChartFromUI as any) ??
  (UI as any)?.AnalyticsChart ??
  (({ data, title }: any) => (
    <div>
      <h4 className="font-medium mb-2">{title}</h4>
      <pre className="text-xs bg-gray-100 p-3 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  ));

const TenantForm =
  (TenantFormFromLocal as any) ??
  (UI as any)?.TenantForm ??
  (({ open, onClose, onSubmit }: any) =>
    open ? (
      <form
        className="mt-4 p-4 border rounded bg-gray-50 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = (e.currentTarget as any).name.value;
          const stripeCustomerId = (e.currentTarget as any).stripeCustomerId.value;
          onSubmit?.(name, stripeCustomerId);
        }}
      >
        <div className="flex gap-2">
          <input name="name" placeholder="Tenant name" className="border p-2 rounded w-64" />
          <input name="stripeCustomerId" placeholder="Stripe customer id" className="border p-2 rounded w-64" />
          <Button type="submit">Create</Button>
          <Button type="button" className="ml-2" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    ) : null);

/** ---------- TYPES ---------- */
type TenantRow = { id: string; name: string; subscriptionStatus: string | null; leadCount: number };
type LeadRow = { id: string; tenantId: string; createdAt: string };
type ConsensusRow = { leadId: string; decision: string; models: string[] | null };
type DashboardProps = {
  user: { id: string; email: string | null };
  role: string | null;
  tenantId: string | null;
  initialTenants: TenantRow[];
  initialLeads: LeadRow[];
  initialConsensus: ConsensusRow[];
};

/** ---------- UTILS ---------- */
function isoWeekKey(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** ---------- PAGE ---------- */
export default function DashboardPage({
  user,
  role,
  tenantId,
  initialTenants,
  initialLeads,
  initialConsensus,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { supabase } = useSupabase();
  const [showOnboard, setShowOnboard] = useState(false);

  const isSuper = (role ?? "").toLowerCase() === "superadmin";

  const { tenants } = useRealtimeTenants(initialTenants, supabase, isSuper ? null : tenantId);
  const { leads } = useRealtimeLeads(initialLeads, supabase, isSuper ? null : tenantId);

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const l of leads) {
      const key = isoWeekKey(new Date(l.createdAt));
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    return Array.from(buckets.entries()).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const tenantColumns = [
    { accessor: "name", header: "Tenant Name" },
    { accessor: "subscriptionStatus", header: "Subscription" },
    { accessor: "leadCount", header: "Leads" },
    {
      accessor: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button variant="outline" size="sm" onClick={() => console.log("tenant", row.id)}>
          View
        </Button>
      ),
    },
  ];

  const leadColumns = [
    { accessor: "tenantId", header: "Tenant" },
    { accessor: "createdAt", header: "Date" },
    {
      accessor: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              const res = await supabase.functions.invoke("transferConversation", { body: { leadId: row.id } });
              if ((res as any).error) console.error((res as any).error);
            } catch (e) {
              console.error(e);
            }
          }}
        >
          Qualify
        </Button>
      ),
    },
  ];

  return (
    <>
      <Head><title>Admin Portal â€” Dashboard</title></Head>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="container-wide">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          <Card className="mb-6">
            <CardHeader><CardTitle>Signed-in User</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-gray-700">
                <div><span className="font-medium">ID:</span> {user.id}</div>
                <div><span className="font-medium">Email:</span> {user.email ?? "â€”"}</div>
                <div><span className="font-medium">Role:</span> {role ?? "â€”"}</div>
                <div><span className="font-medium">Tenant:</span> {tenantId ?? "â€”"}</div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="tenants" className="w-full">
            <TabsList>
              <TabsTrigger value="tenants">Tenants</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="conversations">Consensus</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="tenants">
              <Card>
                <CardHeader><CardTitle>Tenant Overview</CardTitle></CardHeader>
                <CardContent>
                  <DataTable data={tenants} columns={tenantColumns} />
                  {isSuper && (
                    <>
                      <Button className="mt-4" onClick={() => setShowOnboard(true)}>Onboard New Tenant</Button>
                      <TenantForm
                        open={showOnboard}
                        onClose={() => setShowOnboard(false)}
                        onSubmit={async (name: string, stripeCustomerId: string) => {
                          const res = await supabase.functions.invoke("onboardTenant", { body: { name, stripeCustomerId } });
                          if ((res as any).error) console.error((res as any).error);
                          else setShowOnboard(false);
                        }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads">
              <Card>
                <CardHeader><CardTitle>Lead Overview</CardTitle></CardHeader>
                <CardContent><DataTable data={leads} columns={leadColumns} /></CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversations">
              <Card>
                <CardHeader><CardTitle>Consensus Results</CardTitle></CardHeader>
                <CardContent>
                  <DataTable
                    data={initialConsensus}
                    columns={[
                      { accessor: "leadId", header: "Lead ID" },
                      { accessor: "decision", header: "Decision" },
                      { accessor: "models", header: "Models Used" },
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
                <CardContent>
                  <AnalyticsChart data={chartData} title="Leads by ISO Week" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

/** ---------- SSR ---------- */
export const getServerSideProps: GetServerSideProps<DashboardProps> = async (ctx) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => ctx.req.cookies[key],
        set: (key, value, options) => ctx.res.setHeader("Set-Cookie", serialize(key, value, options)),
        remove: (key, options) => ctx.res.setHeader("Set-Cookie", serialize(key, "", { ...options, maxAge: 0 })),
      },
    }
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { redirect: { destination: `/auth/login?next=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
  }

  const { data: urow } = await supabase
    .from("users")
    .select("tenant_id, role, email")
    .eq("id", user.id)
    .maybeSingle();

  const role = (urow?.role ?? (user.app_metadata as any)?.role ?? null) ?? null;
  const tenantId = (urow?.tenant_id ?? (user.user_metadata as any)?.tenant_id ?? null) ?? null;
  const email = urow?.email ?? user.email ?? null;

  const isAdmin = ["admin", "superadmin"].includes((role ?? "").toLowerCase());
  if (!isAdmin && !tenantId) {
    return { redirect: { destination: "/auth/signup", permanent: false } };
  }

  // Tenants
  let initialTenants: TenantRow[] = [];
  if (isAdmin) {
    const { data: t } = await supabase.from("tenants").select("id,name,subscriptionStatus");
    const { data: l } = await supabase.from("leads").select("id,tenantId,createdAt");
    const counts = new Map<string, number>();
    (l ?? []).forEach((x: any) => counts.set(x.tenantId, (counts.get(x.tenantId) || 0) + 1));
    initialTenants = (t ?? []).map((tt: any) => ({
      id: tt.id,
      name: tt.name,
      subscriptionStatus: tt.subscriptionStatus ?? null,
      leadCount: counts.get(tt.id) || 0,
    }));
  } else {
    const { data: t } = await supabase.from("tenants").select("id,name,subscriptionStatus").eq("id", tenantId!).maybeSingle();
    const { data: l } = await supabase.from("leads").select("id,tenantId,createdAt").eq("tenantId", tenantId!);
    initialTenants = t ? [{ id: t.id, name: t.name, subscriptionStatus: t.subscriptionStatus ?? null, leadCount: (l ?? []).length }] : [];
  }

  const { data: leadRows } = isAdmin
    ? await supabase.from("leads").select("id,tenantId,createdAt").order("createdAt", { ascending: false })
    : await supabase.from("leads").select("id,tenantId,createdAt").eq("tenantId", tenantId!).order("createdAt", { ascending: false });

  // Consensus optional
  let initialConsensus: ConsensusRow[] = [];
  try {
    const { data: rows } = isAdmin
      ? await supabase.from("llm_consensus").select("leadId,decision,models").limit(200)
      : await supabase.from("llm_consensus").select("leadId,decision,models").in("leadId", (leadRows ?? []).map((x: any) => x.id));
    initialConsensus = (rows ?? []) as any;
  } catch {}

  return {
    props: {
      user: { id: user.id, email },
      role,
      tenantId,
      initialTenants,
      initialLeads: (leadRows ?? []) as any,
      initialConsensus,
    },
  };
};

