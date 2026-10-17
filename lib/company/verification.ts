export function isCompanyOperational(operationalStatus: string | null | undefined) {
  return operationalStatus === "ACTIVE";
}

export const PORTAL_LOCKED_MESSAGE =
  "Perusahaan belum diverifikasi admin WorkRecord. Selesaikan unggah dokumen dan tunggu persetujuan — setelah aktif, Anda bisa Cari NIK, List, Report, dan Iklan.";
