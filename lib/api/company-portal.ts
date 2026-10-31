import { apiFetch } from "./client";
import { companyDocumentMaxSizeLabel } from "@/lib/company/document-upload";

export type MemberCertificateInfo = {
  memberId: string;
  verifyToken: string;
  validUntil: string | null;
  joinedAt: string;
  lastVerifiedAt: string;
  domicile: string | null;
  canDownload: boolean;
};

export type CompanyVerification = {
  companyId: string;
  operationalStatus: string;
  surveyStatus: string;
  memberCertificate?: MemberCertificateInfo | null;
  documents: {
    type: string;
    status: string;
    rejectReason: string | null;
    hasFile: boolean;
  }[];
  canSubmitForReview: boolean;
  allApproved: boolean;
  siteVerification?: {
    status: string;
    method: string | null;
    contactName: string | null;
    contactPhone: string | null;
    address: string | null;
    preferredScheduleNote: string | null;
    scheduledAt: string | null;
    meetingUrl: string | null;
    adminNotes: string | null;
    completedAt: string | null;
    canRequest: boolean;
    video?: {
      deliveryMode: "MEETING_LINK" | "WEBRTC";
      meetingLinkActive: boolean;
      webrtcReady: boolean;
    };
  };
};

export type SiteVerificationVideoSettings = {
  deliveryMode: "MEETING_LINK" | "WEBRTC";
  meetingLinkActive: boolean;
  webrtcReady: boolean;
  iceServers: { urls: string | string[]; username?: string; credential?: string }[];
  vpsHint: string | null;
};

export function fetchSiteVerificationVideoSettings(token: string) {
  return apiFetch<SiteVerificationVideoSettings>(
    "companies/site-verification/video-settings",
    { token },
  );
}

export type MyCompanyResponse = {
  id: string;
  name: string;
  businessField?: string | null;
  verification: CompanyVerification;
};

export type CompanySettings = {
  id: string;
  name: string;
  companyPhone: string;
  operationalStatus: string;
  adminAccount: {
    fullName: string;
    publicLoginId: string;
    email: string;
    personalPhone: string | null;
    emailVerifiedAt: string | null;
    pendingEmail: string | null;
    pendingEmailExpiresAt: string | null;
  };
};

export function fetchCompanySettings(companyId: string, token: string) {
  return apiFetch<CompanySettings>(`companies/${companyId}/settings`, {
    token,
  });
}

export function updateCompanySettings(
  companyId: string,
  token: string,
  body: { adminEmail?: string; adminFullName?: string; companyPhone?: string },
) {
  return apiFetch<CompanySettings>(`companies/${companyId}/settings`, {
    method: "PATCH",
    token,
    body,
  });
}

export function fetchMyCompany(token: string) {
  return apiFetch<MyCompanyResponse>("companies/me", { token });
}

export function fetchVerification(companyId: string, token: string) {
  return apiFetch<CompanyVerification>(`companies/${companyId}/verification`, {
    token,
  });
}

export function submitVerification(companyId: string, token: string) {
  return apiFetch<CompanyVerification>(
    `companies/${companyId}/verification/submit`,
    { method: "POST", token },
  );
}

export function requestSiteVerification(
  companyId: string,
  token: string,
  body: {
    method: "VIDEO_CALL" | "ON_SITE";
    contactName: string;
    contactPhone: string;
    address: string;
    preferredScheduleNote?: string;
  },
) {
  return apiFetch<CompanyVerification>(
    `companies/${companyId}/site-verification/request`,
    { method: "PATCH", token, body },
  );
}

export async function fetchCompanyDocumentFile(
  companyId: string,
  type: string,
  token: string,
) {
  const base =
    typeof window === "undefined"
      ? process.env.API_URL ?? "http://localhost:3007"
      : process.env.NEXT_PUBLIC_API_BASE ?? "/api";
  const res = await fetch(
    `${base.replace(/\/$/, "")}/companies/${companyId}/documents/${type}/file`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const blob = await res.blob();
  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() ||
    blob.type ||
    "application/octet-stream";
  return { blob, contentType };
}

export async function uploadCompanyDocument(
  companyId: string,
  type: string,
  file: File,
  token: string,
) {
  const form = new FormData();
  form.append("file", file);
  const base =
    typeof window === "undefined"
      ? process.env.API_URL ?? "http://localhost:3007"
      : process.env.NEXT_PUBLIC_API_BASE ?? "/api";
  const res = await fetch(
    `${base.replace(/\/$/, "")}/companies/${companyId}/documents/${type}/upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    const maxLabel = companyDocumentMaxSizeLabel();
    if (
      res.status === 413 ||
      /request entity too large/i.test(text) ||
      /entity too large/i.test(res.statusText)
    ) {
      throw new Error(
        `Berkas terlalu besar. Ukuran maksimal ${maxLabel} per dokumen.`,
      );
    }
    let message = text || res.statusText;
    if (message.trim().startsWith("<")) {
      throw new Error(
        `Gagal mengunggah dokumen (HTTP ${res.status}). Pastikan berkas ≤ ${maxLabel}.`,
      );
    }
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      const raw = parsed.message;
      if (Array.isArray(raw)) message = raw.filter(Boolean).join("\n");
      else if (typeof raw === "string" && raw.trim()) message = raw;
    } catch {
      /* plain text */
    }
    throw new Error(message);
  }
  return res.json();
}

export type PortalEmployeeRow = {
  id: string;
  employeeName: string;
  nationalIdNumber: string | null;
  employeeIdNumber: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  hasBlacklist: boolean;
  blacklistId: string | null;
  blacklistNote: string | null;
  position: string | null;
  hasPhoto: boolean;
  changeRevisionCount?: number;
};

export function fetchEmployeeList(companyId: string, token: string) {
  return apiFetch<PortalEmployeeRow[]>(`companies/${companyId}/employees`, {
    token,
  });
}

/** Daftar karyawan portal; fallback ke employee-records jika endpoint ringkas gagal. */
export async function fetchPortalEmployeeList(
  companyId: string,
  token: string,
): Promise<PortalEmployeeRow[]> {
  let primaryError: unknown;
  try {
    const data = await fetchEmployeeList(companyId, token);
    if (!Array.isArray(data)) {
      throw new Error("Format data karyawan tidak valid.");
    }
    return data;
  } catch (err) {
    primaryError = err;
  }
  try {
    const { fetchEmployeeRecords } = await import("./records");
    const records = await fetchEmployeeRecords(companyId, { token });
    if (!Array.isArray(records)) {
      throw new Error("Format data karyawan tidak valid.");
    }
    return records.map((r) => ({
      id: r.id,
      employeeName: r.employeeName,
      nationalIdNumber: r.nationalIdNumber ?? null,
      employeeIdNumber: r.employeeIdNumber ?? null,
      position: r.position ?? null,
      hasPhoto: Boolean(r.hasPhoto),
      joinedAt: r.joinedAt ?? null,
      leftAt: r.leftAt ?? null,
      hasBlacklist: Boolean(
        r.blacklistedByViewerCompany ?? r.hasBlacklist,
      ),
      blacklistId: null,
      blacklistNote: r.blacklistNote ?? null,
      changeRevisionCount: 0,
    }));
  } catch {
    throw primaryError;
  }
}

export type DisputeReportRow = {
  id: string;
  status: string;
  description: string;
  employeeRecordId: string | null;
  employeeName: string | null;
  nationalIdNumber: string;
  position: string | null;
  paymentId: string;
  paymentStatus: string | null;
  amountIdr: number;
  createdAt: string;
};

export type DisputeReport = {
  totalSpent: number;
  totalSanggahan: number;
  activeSanggahan: number;
  currency: string;
  disputes: DisputeReportRow[];
};

export function fetchDisputeReport(companyId: string, token: string) {
  return apiFetch<DisputeReport>(`companies/${companyId}/dispute-report`, {
    token,
  });
}
