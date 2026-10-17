"use client";

import { useEffect, useState } from "react";
import { employeePhotoUrl } from "@/lib/api/employees";

type Props = {
  companyId: string;
  recordId: string;
  token: string;
  size?: "thumb" | "detail";
  className?: string;
};

export function EmployeeRecordPhoto({
  companyId,
  recordId,
  token,
  size = "detail",
  className,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      const res = await fetch(employeePhotoUrl(companyId, recordId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok || cancelled) return;
      const blob = await res.blob();
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [companyId, recordId, token]);

  if (!src) {
    return <span className="explore-muted">{size === "thumb" ? "…" : "Memuat foto…"}</span>;
  }

  if (size === "thumb") {
    return (
      <img
        src={src}
        alt=""
        className={className ?? "employee-thumb"}
        width={40}
        height={40}
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={className ?? "employee-detail-photo"}
      width={160}
      height={160}
    />
  );
}
