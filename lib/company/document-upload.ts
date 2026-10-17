const PDF_ONLY_TYPES = new Set(["NIB", "AKTA"]);

const KTP_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf";

/** Nilai `accept` pada input file per jenis dokumen verifikasi PT. */
export function companyDocumentAcceptAttr(type: string): string {
  if (PDF_ONLY_TYPES.has(type)) {
    return ".pdf,application/pdf";
  }
  return KTP_ACCEPT;
}

/**
 * Validasi klien sebelum unggah. Mengembalikan pesan error atau null jika lolos.
 */
export function validateCompanyDocumentFile(
  type: string,
  file: File,
): string | null {
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();

  if (PDF_ONLY_TYPES.has(type)) {
    const looksPdf =
      mime === "application/pdf" ||
      name.endsWith(".pdf");
    if (!looksPdf) {
      return "NIB dan Akta perusahaan hanya boleh berformat PDF.";
    }
    return null;
  }

  const allowed =
    mime === "application/pdf" ||
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    /\.(pdf|jpe?g|png|webp)$/.test(name);
  if (!allowed) {
    return "Format tidak didukung. Gunakan PDF atau gambar (JPG, PNG, WebP).";
  }
  return null;
}
