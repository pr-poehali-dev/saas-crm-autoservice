ALTER TABLE t_p47435488_saas_crm_autoservice.appointments
  ADD COLUMN warehouse_id UUID REFERENCES t_p47435488_saas_crm_autoservice.warehouses(id);