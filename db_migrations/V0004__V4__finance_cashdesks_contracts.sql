CREATE TABLE t_p47435488_saas_crm_autoservice.cashdesks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    company_id  UUID REFERENCES t_p47435488_saas_crm_autoservice.companies(id),
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'cash',
    currency    TEXT NOT NULL DEFAULT 'RUB',
    balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.finance_operations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    cashdesk_id     UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.cashdesks(id),
    counterparty_id UUID REFERENCES t_p47435488_saas_crm_autoservice.counterparties(id),
    appointment_id  UUID REFERENCES t_p47435488_saas_crm_autoservice.appointments(id),
    deal_id         UUID REFERENCES t_p47435488_saas_crm_autoservice.deals(id),
    created_by      UUID REFERENCES t_p47435488_saas_crm_autoservice.tenant_users(id),
    type            TEXT NOT NULL DEFAULT 'income',
    category        TEXT,
    amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
    description     TEXT,
    operation_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    company_id      UUID REFERENCES t_p47435488_saas_crm_autoservice.companies(id),
    counterparty_id UUID REFERENCES t_p47435488_saas_crm_autoservice.counterparties(id),
    number          TEXT NOT NULL,
    name            TEXT,
    type            TEXT NOT NULL DEFAULT 'service',
    status          TEXT NOT NULL DEFAULT 'draft',
    signed_at       DATE,
    valid_from      DATE,
    valid_to        DATE,
    amount          NUMERIC(14,2),
    note            TEXT,
    file_url        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
