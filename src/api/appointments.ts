const BASE_URL = "https://functions.poehali.dev/c8e03741-068e-4280-b9ad-722d6e2b007d";

// Временный tenant_id — заменить на реальный после добавления авторизации
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

const headers = () => ({
  "Content-Type": "application/json",
  "X-Tenant-Id": TENANT_ID,
});

export interface Appointment {
  id: string;
  number: string;
  status: string;
  scheduled_at: string | null;
  mileage: number | null;
  complaint: string | null;
  created_at: string;
  client_name: string | null;
  client_phone: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_plate: string | null;
  car_year: number | null;
  assigned_name: string | null;
}

export interface AppointmentListResponse {
  items: Appointment[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateAppointmentBody {
  counterparty_id?: string;
  car_id?: string;
  company_id?: string;
  assigned_to?: string;
  scheduled_at?: string;
  mileage?: number;
  complaint?: string;
  note?: string;
  status?: string;
}

export async function fetchAppointments(params?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AppointmentListResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));

  const res = await fetch(`${BASE_URL}${qs.toString() ? "?" + qs : ""}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
  return res.json();
}

export async function createAppointment(body: CreateAppointmentBody): Promise<{ id: string; number: string }> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
  return res.json();
}

export async function updateAppointment(id: string, body: Partial<CreateAppointmentBody> & { status?: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}?id=${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
}
