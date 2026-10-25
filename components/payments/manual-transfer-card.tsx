import {
  formatIdr,
  type ManualTransferInfo,
} from "@/lib/api/manual-payment";

type Props = {
  info: ManualTransferInfo;
  title?: string;
};

export function ManualTransferCard({ info, title = "Instruksi transfer" }: Props) {
  return (
    <div className="manual-transfer-card" role="status">
      <h3 className="manual-transfer-card-title">{title}</h3>
      <dl className="manual-transfer-card-dl">
        <div>
          <dt>Bank</dt>
          <dd>{info.bankName}</dd>
        </div>
        <div>
          <dt>No. rekening</dt>
          <dd>{info.accountNumber}</dd>
        </div>
        <div>
          <dt>Atas nama</dt>
          <dd>{info.accountHolder}</dd>
        </div>
        <div>
          <dt>Nominal transfer</dt>
          <dd>
            <strong>{formatIdr(info.transferAmount)}</strong>
            <span className="manual-transfer-card-hint">
              ({formatIdr(info.baseAmount)} + kode{" "}
              {String(info.uniqueCode).padStart(3, "0")})
            </span>
          </dd>
        </div>
      </dl>
      <p className="manual-transfer-card-note">{info.note}</p>
    </div>
  );
}
