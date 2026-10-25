import Swal from "sweetalert2";
import {
  type ManualTransferInfo,
  manualTransferSummaryLines,
} from "@/lib/api/manual-payment";

export async function showManualTransferAlert(
  title: string,
  info: ManualTransferInfo,
  footer?: string,
) {
  const html = `
    <div class="manual-transfer-swal">
      <p><strong>Transfer ke rekening berikut:</strong></p>
      <ul style="text-align:left;margin:12px 0;padding-left:1.2rem;line-height:1.6">
        ${manualTransferSummaryLines(info)
          .map((line) => `<li>${line}</li>`)
          .join("")}
      </ul>
      ${
        footer
          ? `<p style="font-size:13px;color:#475569;margin-top:8px">${footer}</p>`
          : ""
      }
    </div>
  `;
  await Swal.fire({
    icon: "info",
    title,
    html,
    confirmButtonText: "Mengerti",
    confirmButtonColor: "#2459df",
    width: 520,
  });
}
