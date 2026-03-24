CREATE TABLE t_p47435488_saas_crm_autoservice.nomenclature_groups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    parent_id  UUID REFERENCES t_p47435488_saas_crm_autoservice.nomenclature_groups(id),
    name       TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'service',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.nomenclature (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    group_id    UUID REFERENCES t_p47435488_saas_crm_autoservice.nomenclature_groups(id),
    type        TEXT NOT NULL DEFAULT 'product',
    code        TEXT,
    name        TEXT NOT NULL,
    unit        TEXT NOT NULL DEFAULT 'шт',
    price       NUMERIC(14,2) NOT NULL DEFAULT 0,
    cost        NUMERIC(14,2) NOT NULL DEFAULT 0,
    vat_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.services (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    nomenclature_id UUID REFERENCES t_p47435488_saas_crm_autoservice.nomenclature(id),
    name         TEXT NOT NULL,
    description  TEXT,
    price        NUMERIC(14,2) NOT NULL DEFAULT 0,
    duration_min INTEGER,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    nomenclature_id UUID REFERENCES t_p47435488_saas_crm_autoservice.nomenclature(id),
    name            TEXT NOT NULL,
    sku             TEXT,
    brand           TEXT,
    unit            TEXT NOT NULL DEFAULT 'шт',
    price           NUMERIC(14,2) NOT NULL DEFAULT 0,
    cost            NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.warehouses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    company_id  UUID REFERENCES t_p47435488_saas_crm_autoservice.companies(id),
    name        TEXT NOT NULL,
    address     TEXT,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p47435488_saas_crm_autoservice.stock (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.tenants(id),
    warehouse_id  UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.warehouses(id),
    product_id    UUID NOT NULL REFERENCES t_p47435488_saas_crm_autoservice.products(id),
    quantity      NUMERIC(14,3) NOT NULL DEFAULT 0,
    reserved      NUMERIC(14,3) NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (warehouse_id, product_id)
);
