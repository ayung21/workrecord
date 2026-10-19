import QRCode from "qrcode";
import { memberVerifyPageUrl } from "@/lib/member-certificate/urls";

export type DownloadMemberCertificateOptions = {
  companyName: string;
  memberId: string;
  verifyToken: string;
  fileName: string;
};

const BENEFITS = [
  "Riwayat Kerja Terverifikasi",
  "Data Lebih Akurat",
  "Rekrutmen Lebih Profesional",
] as const;

async function loadImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Logo tidak dapat dimuat untuk PDF.");
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca logo."));
    reader.readAsDataURL(blob);
  });
}

async function loadRasterImage(url: string) {
  const dataUrl = await loadImageAsDataUrl(url);
  const size = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Logo gagal dimuat."));
      img.src = dataUrl;
    },
  );
  return { dataUrl, ...size };
}

/** Ukuran mm dengan rasio aspek asli (tidak distretch). */
function fitImageMm(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number,
) {
  if (naturalW <= 0 || naturalH <= 0) {
    return { w: maxW, h: maxH };
  }
  const ratio = naturalW / naturalH;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" {
  if (dataUrl.startsWith("data:image/jpeg")) return "JPEG";
  return "PNG";
}

export async function downloadMemberCertificatePdf(
  options: DownloadMemberCertificateOptions,
) {
  const { jsPDF } = await import("jspdf");

  const verifyUrl = memberVerifyPageUrl(options.verifyToken);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const logo = await loadRasterImage(`${origin}/brand/logo.png`);
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 240,
    margin: 1,
    color: { dark: "#0a1628", light: "#ffffff" },
  });

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 16;
  const marginR = 16;
  const contentW = pageW - marginL - marginR;
  const sideW = 52;
  const mainW = contentW - sideW - 8;
  const sideX = pageW - marginR - sideW;

  let y = 12;

  /** Selaras pratinjau web: logo 180px pada lebar sertifikat 1050px */
  const logoMaxW = contentW * (180 / 1050);
  const logoSize = fitImageMm(
    logo.width,
    logo.height,
    logoMaxW,
    logoMaxW,
  );
  const logoFmt = detectImageFormat(logo.dataUrl);
  doc.addImage(
    logo.dataUrl,
    logoFmt,
    marginL,
    y,
    logoSize.w,
    logoSize.h,
  );

  y += logoSize.h + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Track • Manage • Grow", marginL, y);

  y += 5;
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.6);
  doc.line(marginL, y, pageW - marginR, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(30, 58, 138);
  doc.text("MEMBER COMPANY", marginL, y);

  y += 2;
  doc.setFillColor(37, 99, 235);
  doc.rect(marginL, y, 32, 1.4, "F");

  const bodyTop = y + 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginL, bodyTop, pageW - marginR, bodyTop);
  doc.line(sideX - 4, bodyTop, sideX - 4, pageH - 22);

  let mainY = bodyTop + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(82, 97, 124);
  const lead =
    "Perusahaan ini menggunakan WorkRecord untuk pencatatan dan verifikasi riwayat kerja tenaga kerja.";
  const leadLines = doc.splitTextToSize(lead, mainW);
  doc.text(leadLines, marginL, mainY);
  mainY += leadLines.length * 5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text("Riwayat kerja jelas.", marginL, mainY);
  mainY += 7;
  doc.setTextColor(36, 89, 223);
  doc.text("Rekrut lebih percaya diri.", marginL, mainY);
  mainY += 10;

  doc.setDrawColor(226, 232, 240);
  doc.line(marginL, mainY, marginL + mainW, mainY);
  mainY += 8;

  const qrSize = 26;
  doc.addImage(qrDataUrl, "PNG", marginL, mainY, qrSize, qrSize);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Scan untuk verifikasi perusahaan", marginL + qrSize + 6, mainY + 10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(`Member ID : ${options.memberId}`, marginL + qrSize + 6, mainY + 16);

  let benefitY = bodyTop + 10;
  for (const label of BENEFITS) {
    doc.setFillColor(37, 99, 235);
    doc.circle(sideX + 4, benefitY - 1.2, 2.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(82, 97, 124);
    const lines = doc.splitTextToSize(label, sideW - 10);
    doc.text(lines, sideX + 9, benefitY);
    benefitY += lines.length * 4.5 + 8;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 28, 51);
  const nameLines = doc.splitTextToSize(options.companyName, contentW);
  doc.text(nameLines, marginL, pageH - 14);

  doc.save(options.fileName);
}
