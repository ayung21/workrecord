/**
 * Unduh PDF dari elemen pratinjau sertifikat (DOM → canvas → PDF)
 * agar hasil unduhan sama dengan tampilan di layar.
 */
export type DownloadMemberCertificateOptions = {
  element: HTMLElement;
  fileName: string;
};

async function waitForCertificateAssets(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          window.setTimeout(done, 4000);
        }),
    ),
  );
  /** QR di-generate async; tunggu sampai ada data URL di dalam sheet. */
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const qr = element.querySelector(
      ".member-cert-sheet-qr img, .member-cert-qr-img",
    ) as HTMLImageElement | null;
    if (qr?.src?.startsWith("data:image")) break;
    await new Promise((r) => window.setTimeout(r, 80));
  }
}

export async function downloadMemberCertificatePdf(
  options: DownloadMemberCertificateOptions,
) {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  await waitForCertificateAssets(options.element);

  const canvas = await html2canvas(options.element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15_000,
  });

  const imgData = canvas.toDataURL("image/png");
  const imgW = canvas.width;
  const imgH = canvas.height;
  if (imgW <= 0 || imgH <= 0) {
    throw new Error("Gagal merender sertifikat ke PDF.");
  }

  /** Halaman PDF mengikuti rasio sheet (bukan memaksa A4 kosong di samping). */
  const pageWmm = 297;
  const pageHmm = pageWmm * (imgH / imgW);
  const doc = new jsPDF({
    orientation: pageWmm >= pageHmm ? "landscape" : "portrait",
    unit: "mm",
    format: [pageWmm, pageHmm],
  });

  doc.addImage(imgData, "PNG", 0, 0, pageWmm, pageHmm, undefined, "FAST");
  doc.save(options.fileName);
}
