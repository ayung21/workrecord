import { apiFetch, getApiBaseUrl } from "./client";
import { throwFormUploadError } from "./form-upload-error";

export type CreateEmployeeInput = {
  nationalIdNumber: string;
  employeeName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  joinedAt: string;
  leftAt?: string;
  position: string;
  conductSummary?: string;
  photo: File;
};

export async function createEmployeeRecord(
  companyId: string,
  token: string,
  input: CreateEmployeeInput,
) {
  const form = new FormData();
  form.append("photo", input.photo);
  form.append("nationalIdNumber", input.nationalIdNumber);
  form.append("employeeName", input.employeeName);
  form.append("placeOfBirth", input.placeOfBirth);
  form.append("dateOfBirth", input.dateOfBirth);
  form.append("joinedAt", input.joinedAt);
  form.append("position", input.position);
  if (input.leftAt) form.append("leftAt", input.leftAt);
  if (input.conductSummary) form.append("conductSummary", input.conductSummary);

  const base = getApiBaseUrl();
  const res = await fetch(
    `${base}/companies/${companyId}/employee-records`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throwFormUploadError(res, text, data, {
      tooLargeMessage:
        "Foto terlalu besar untuk server. Pilih gambar lebih kecil atau hubungi admin (batas nginx).",
      htmlFallbackLabel: "foto karyawan",
    });
  }
  return data;
}

export type EmployeeChangePayload = {
  employeeName?: string;
  nationalIdNumber?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  position?: string;
  joinedAt?: string;
  leftAt?: string;
  employeeIdNumber?: string;
  employeeCode?: string;
  conductSummary?: string;
  photoStagingPath?: string;
  note?: string;
  blacklistCheckoutPaymentId?: string;
  id?: string;
};

export type EmployeeChangeRequest = {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  employeeRecordId?: string | null;
  rejectionReason?: string | null;
  payload: EmployeeChangePayload;
  /** Pengajuan sanggahan sudah checkout; menunggu konfirmasi/pembayaran. */
  awaitingBlacklistPayment?: boolean;
  blacklistCheckoutPaymentId?: string | null;
  requestedBy?: {
    fullName: string;
    publicLoginId: string;
    accountType: string;
  } | null;
  processedBy?: {
    fullName: string;
    publicLoginId: string;
    accountType: string;
  } | null;
};

export type PendingEmployeeRequest = EmployeeChangeRequest;

export type EmployeeChangeHistory = {
  changeCount: number;
  items: EmployeeChangeRequest[];
};

export type UpdateEmployeeInput = {
  nationalIdNumber?: string;
  employeeName?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  joinedAt?: string;
  leftAt?: string | null;
  position?: string;
  employeeIdNumber?: string;
  conductSummary?: string;
  photo?: File;
};

function normalizeOptionalDate(
  value: string | null | undefined,
  empty: "omit" | "null",
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return empty === "null" ? null : undefined;
  if (!value.trim()) return empty === "null" ? null : undefined;
  return value.trim();
}

/** Payload PATCH — hindari string kosong yang gagal validasi `@IsDateString`. */
function serializeEmployeeUpdateBody(
  input: Omit<UpdateEmployeeInput, "photo">,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input)) {
    if (val === undefined) continue;
    if (key === "leftAt") {
      const normalized = normalizeOptionalDate(val as string | null, "null");
      if (normalized !== undefined) body.leftAt = normalized;
      continue;
    }
    if (key === "dateOfBirth" || key === "joinedAt") {
      const normalized = normalizeOptionalDate(val as string | null, "omit");
      if (normalized !== undefined) body[key] = normalized;
      continue;
    }
    if (typeof val === "string" && !val.trim()) continue;
    body[key] = val;
  }
  return body;
}

export function isPendingEmployeeCreate(
  data: unknown,
): data is PendingEmployeeRequest {
  return (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    (data as PendingEmployeeRequest).status === "PENDING_APPROVAL" &&
    (data as PendingEmployeeRequest).action === "CREATE"
  );
}

export function fetchPendingEmployeeApprovals(companyId: string, token: string) {
  return apiFetch<EmployeeChangeRequest[]>(
    `companies/${companyId}/employee-records/approvals/pending`,
    { token },
  );
}

export function fetchRejectedEmployeeApprovals(companyId: string, token: string) {
  return apiFetch<EmployeeChangeRequest[]>(
    `companies/${companyId}/employee-records/approvals/rejected`,
    { token },
  );
}

export function fetchApprovalRequestDetail(
  companyId: string,
  token: string,
  requestId: string,
) {
  return apiFetch<EmployeeChangeRequest>(
    `companies/${companyId}/employee-records/approvals/${requestId}`,
    { token },
  );
}

export function fetchEmployeeChangeHistory(
  companyId: string,
  token: string,
  recordId: string,
) {
  return apiFetch<EmployeeChangeHistory>(
    `companies/${companyId}/employee-records/${recordId}/changes`,
    { token },
  );
}

export function approveEmployeeRequest(
  companyId: string,
  token: string,
  requestId: string,
) {
  return apiFetch(`companies/${companyId}/employee-records/approvals/${requestId}/approve`, {
    method: "POST",
    token,
  });
}

export function rejectEmployeeRequest(
  companyId: string,
  token: string,
  requestId: string,
  rejectionReason: string,
) {
  return apiFetch(
    `companies/${companyId}/employee-records/approvals/${requestId}/reject`,
    {
      method: "POST",
      token,
      body: { rejectionReason },
    },
  );
}

export async function updateEmployeeRecord(
  companyId: string,
  token: string,
  recordId: string,
  input: UpdateEmployeeInput,
) {
  const base = getApiBaseUrl();
  const { photo, ...fields } = input;
  const body = serializeEmployeeUpdateBody(fields);
  const hasPhoto = Boolean(photo);
  if (hasPhoto) {
    const form = new FormData();
    if (photo) form.append("photo", photo);
    for (const [key, val] of Object.entries(body)) {
      if (val === null) form.append(key, "");
      else if (val !== undefined) form.append(key, String(val));
    }
    const res = await fetch(
      `${base}/companies/${companyId}/employee-records/${recordId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      throwFormUploadError(res, text, data, {
        tooLargeMessage:
          "Foto terlalu besar untuk server. Pilih gambar lebih kecil atau hubungi admin (batas nginx).",
        htmlFallbackLabel: "foto karyawan",
      });
    }
    return data;
  }
  return apiFetch(`companies/${companyId}/employee-records/${recordId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function employeePhotoUrl(companyId: string, recordId: string): string {
  const base = getApiBaseUrl();
  return `${base}/companies/${companyId}/employee-records/${recordId}/photo`;
}

export type DeletedEmployeeRow = {
  id: string;
  employeeName: string;
  nationalIdNumber: string | null;
  position: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  deletedAt: string;
  deletedBy: {
    fullName: string;
    publicLoginId: string;
  } | null;
};

export function fetchDeletedEmployeeHistory(companyId: string, token: string) {
  return apiFetch<{ items: DeletedEmployeeRow[] }>(
    `companies/${companyId}/employee-records/deleted`,
    { token },
  );
}

export function deleteEmployeeRecord(
  companyId: string,
  token: string,
  recordId: string,
) {
  return apiFetch<{ id: string }>(
    `companies/${companyId}/employee-records/${recordId}`,
    { method: "DELETE", token },
  );
}
