CREATE TABLE t_p47435488_saas_crm_autoservice.tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    plan        TEXT NOT NULL DEFAULT 'trial',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    name        TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.tenant_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    role_id       UUID REFERENCES t_p47435488_saas_crm_autoservice.roles(id),
    email         TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    phone         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE t_p47435488_saas_crm_autoservice.companies (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    name           TEXT NOT NULL,
    short_name     TEXT,
    inn            TEXT,
    kpp            TEXT,
    ogrn           TEXT,
    legal_address  TEXT,
    actual_address TEXT,
    phone          TEXT,
    email          TEXT,
    is_default     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.requisites (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    company_id   UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.companies(id),
    bank_name    TEXT NOT NULL,
    bik          TEXT,
    corr_account TEXT,
    account      TEXT NOT NULL,
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.counterparties (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    type       TEXT NOT NULL DEFAULT 'individual',
    full_name  TEXT NOT NULL,
    short_name TEXT,
    phone      TEXT,
    email      TEXT,
    inn        TEXT,
    kpp        TEXT,
    address    TEXT,
    note       TEXT,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.counterparty_cars (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    counterparty_id UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.counterparties(id),
    brand           TEXT NOT NULL,
    model           TEXT NOT NULL,
    year            SMALLINT,
    vin             TEXT,
    plate           TEXT,
    color           TEXT,
    mileage         INTEGER,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
