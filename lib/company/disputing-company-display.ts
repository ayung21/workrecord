/** Label sanggahan lintas PT: `PT Contoh - 02112345678`. */
export function formatDisputingCompanyDisplay(
  companyName: string,
  companyPhone?: string | null,
): string {
  const name = companyName.trim() || "Perusahaan";
  const phone = companyPhone?.trim();
  return phone ? `${name} - ${phone}` : name;
}
