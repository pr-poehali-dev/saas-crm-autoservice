CREATE TABLE t_p47435488_saas_crm_autoservice.appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    company_id      UUID REFERENCES t_p47435488_saas_crm_autoservice.companies(id),
    counterparty_id UUID REFERENCES t_p47435488_saas_crm_autoservice.counterparties(id),
    car_id          UUID REFERENCES t_p47435488_saas_crm_autoservice.counterparty_cars(id),
    assigned_to     UUID REFERENCES t_p47435488_saas_crm_autoservice.tenant_users(id),
    number          TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'new',
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    mileage         INTEGER,
    complaint       TEXT,
    diagnosis       TEXT,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.appointment_services (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    appointment_id UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.appointments(id),
    service_id     UUID REFERENCES t_p47435488_saas_crm_autoservice.services(id),
    name           TEXT NOT NULL,
    quantity       NUMERIC(14,3) NOT NULL DEFAULT 1,
    price          NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount       NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount         NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE t_p47435488_saas_crm_autoservice.appointment_products (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    appointment_id UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.appointments(id),
    product_id     UUID REFERENCES t_p47435488_saas_crm_autoservice.products(id),
    warehouse_id   UUID REFERENCES t_p47435488_saas_crm_autoservice.warehouses(id),
    name           TEXT NOT NULL,
    quantity       NUMERIC(14,3) NOT NULL DEFAULT 1,
    price          NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount       NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount         NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE t_p47435488_saas_crm_autoservice.deals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    company_id      UUID REFERENCES t_p47435488_saas_crm_autoservice.companies(id),
    counterparty_id UUID REFERENCES t_p47435488_saas_crm_autoservice.counterparties(id),
    appointment_id  UUID REFERENCES t_p47435488_saas_crm_autoservice.appointments(id),
    assigned_to     UUID REFERENCES t_p47435488_saas_crm_autoservice.tenant_users(id),
    number          TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'new',
    stage           TEXT,
    amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
    closed_at       TIMESTAMPTZ,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
