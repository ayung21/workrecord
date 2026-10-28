const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/** Batas berkas mentah sebelum kompresi di browser (selaras dengan multer API). */
export const EMPLOYEE_PHOTO_MAX_RAW_BYTES = 5 * 1024 * 1024;

/** Selaras dengan `compressUploadedImage` di API (maxEdge 1200). */
export const EMPLOYEE_PHOTO_MAX_EDGE = 1200;

export function employeePhotoMaxRawSizeLabel(): string {
  return "5 MB";
}

export function validateEmployeePhotoFile(file: File): string | null {
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.includes(mime as (typeof ALLOWED_MIME)[number])) {
    return "Foto harus JPG, PNG, atau WEBP.";
  }
  if (file.size > EMPLOYEE_PHOTO_MAX_RAW_BYTES) {
    return `Ukuran foto maksimal ${employeePhotoMaxRawSizeLabel()} sebelum diproses.`;
  }
  if (file.size <= 0) {
    return "Berkas foto tidak valid.";
  }
  return null;
}

/**
 * Perkecil foto di browser (WebP) agar upload tidak kena batas nginx dan selaras dengan kompresi API.
 */
export async function prepareEmployeePhotoForUpload(file: File): Promise<File> {
  const validationError = validateEmployeePhotoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (typeof document === "undefined") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale =
      longest > EMPLOYEE_PHOTO_MAX_EDGE
        ? EMPLOYEE_PHOTO_MAX_EDGE / longest
        : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Browser tidak dapat memproses foto. Coba browser lain.");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b
            ? resolve(b)
            : reject(new Error("Kompresi foto gagal. Coba gambar lain.")),
        "image/webp",
        0.82,
      );
    });

    const baseName =
      file.name.replace(/\.[^.]+$/i, "").trim() || "foto-karyawan";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}
