CREATE POLICY tenants_policy ON tenants
  FOR ALL
  USING (auth.uid() = created_by OR role = 'superadmin')
  WITH CHECK (auth.uid() = created_by OR role = 'superadmin');
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_policy ON leads
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;