import { apiFetch } from "./client";

export type PublicMemberVerification = {
  companyName: string;
  memberId: string | null;
  verifyToken: string;
  membershipStatus: "ACTIVE" | "SUSPENDED";
  verificationStatus: string;
  memberCategory: string;
  businessField: string | null;
  domicile: string | null;
  joinedAt: string;
  validUntil: string;
  lastVerifiedAt: string;
};

export function fetchPublicMemberVerification(token: string) {
  return apiFetch<PublicMemberVerification>(
    `companies/member-verify/${encodeURIComponent(token)}`,
  );
}
