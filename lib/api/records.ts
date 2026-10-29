import { apiFetch } from "./client";

export type CompanyPublic = {
  id: string;
  name: string;
  companyPhone: string;
  surveyStatus: string;
  isActive: boolean;
};

export type EmployeeRecordView = {
  id: string;
  companyId?: string;
  companyName?: string;
  employeeProfileId?: string | null;
  publicWorkRecordId?: string | null;
  registeredCompanyCount?: number;
  employeeName: string;
  /** NIK KTP 16 digit */
  nationalIdNumber?: string | null;
  /** Kode ID karyawan internal perusahaan (bukan NIK KTP) */
  employeeIdNumber?: string | null;
  placeOfBirth?: string | null;
  dateOfBirth?: string | null;
  position?: string | null;
  hasPhoto?: boolean;
  joinedAt?: string | null;
  leftAt?: string | null;
  conductSummary?: string | null;
  violationNotes?: string | null;
  hasEmployeeDispute?: boolean;
  hasBlacklist?: boolean;
  blacklistedByViewerCompany?: boolean;
  blacklistNote?: string | null;
  /** Record ini disanggahkan oleh perusahaan pembuat record (tanpa alasan untuk PT lain). */
  disputedByEmployer?: boolean;
  disputedByCompanyId?: string | null;
  disputedByCompanyName?: string | null;
  disputedByCompanyPhone?: string | null;
  visibility: "full";
};

export type DisputingCompanyRef = {
  companyId: string;
  companyName: string;
  companyPhone?: string | null;
  employeeRecordId?: string | null;
};

export type NikSearchResult = {
  nik: string;
  items: EmployeeRecordView[];
  disputingCompanies?: DisputingCompanyRef[];
};

export function searchRecordsByNik(nik: string, token: string) {
  const params = new URLSearchParams({ nik });
  return apiFetch<NikSearchResult>(
    `explore/employee-records?${params.toString()}`,
    { token },
  );
}

export function fetchCompanyPublic(companyId: string) {
  return apiFetch<CompanyPublic>(`companies/${companyId}/public`);
}

export function fetchEmployeeRecords(
  companyId: string,
  options?: { viewToken?: string; token?: string },
) {
  const params = new URLSearchParams();
  if (options?.viewToken) {
    params.set("viewToken", options.viewToken);
  }
  const qs = params.toString();
  return apiFetch<EmployeeRecordView[]>(
    `companies/${companyId}/employee-records${qs ? `?${qs}` : ""}`,
    { token: options?.token },
  );
}

export function fetchEmployeeRecord(
  companyId: string,
  recordId: string,
  options?: { viewToken?: string; token?: string },
) {
  const params = new URLSearchParams();
  if (options?.viewToken) {
    params.set("viewToken", options.viewToken);
  }
  const qs = params.toString();
  return apiFetch<EmployeeRecordView>(
    `companies/${companyId}/employee-records/${recordId}${qs ? `?${qs}` : ""}`,
    { token: options?.token },
  );
}
