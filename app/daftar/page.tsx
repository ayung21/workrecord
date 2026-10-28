"use client";

import Link from "@/components/app-link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Loader2,
  Mail,
  Phone,
  ScrollText,
  User,
  Users,
} from "lucide-react";
import { ApiRequestError } from "@/lib/api/client";
import {
  registerCompany,
  type PartnerRelationRole,
} from "@/lib/api/companies";
import {
  companyTermsIntro,
  companyTermsSections,
  companyTermsTitle,
} from "@/lib/content/company-terms-id";
import Swal from "sweetalert2";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthFormLogo } from "@/components/auth/auth-form-logo";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

const copy = {
  id: {
    title: "Daftarkan perusahaan",
    subtitle:
      "Setelah mengisi data, Anda akan diarahkan ke pembayaran langganan. Wajib mendaftarkan akun kedua (Admin atau Master) sesuai peran.",
    company: "Data perusahaan",
    payer: "Akun Utama Anda",
    partner: "Akun kedua untuk login WorkRecord",
    partnerHint:
      "Pilih peran akun kedua. Setelah pendaftaran, email akun kedua akan menerima tautan untuk mengatur kata sandi (halaman aktivasi).",
    atasan: "Atasan (Master)",
    bawahan: "Bawahan (Admin)",
    yourRole: "Peran Anda otomatis:",
    terms: "Syarat dan ketentuan",
    c1: "Saya menyatakan seluruh informasi perusahaan yang saya berikan adalah benar.",
    c2: "Saya merupakan pihak yang berwenang untuk mendaftarkan dan mewakili perusahaan ini.",
    c3: "Saya bertanggung jawab atas aktivitas Akun Master dan Akun Admin perusahaan.",
    c4: "Saya menyetujui Syarat dan Ketentuan serta Kebijakan Privasi WorkRecord.",
    submit: "Daftarkan perusahaan",
    submitting: "Mendaftarkan…",
    back: "Kembali ke beranda",
    error: "Pendaftaran gagal. Periksa data Anda.",
    hasAccount: "Sudah punya akun?",
    signIn: "Masuk",
  },
  en: {
    title: "Register your company",
    subtitle:
      "After submitting, you will proceed to subscription payment. A second account (Admin or Master) is required.",
    company: "Company details",
    payer: "Your account (subscription payer)",
    partner: "Second WorkRecord login account",
    partnerHint:
      "Choose the second account’s role. After registration, the second email will receive a link to set their password.",
    atasan: "Supervisor (Master)",
    bawahan: "Subordinate (Admin)",
    yourRole: "Your role:",
    terms: "Terms and conditions",
    c1: "I confirm all company information provided is accurate.",
    c2: "I am authorized to register and represent this company.",
    c3: "I accept responsibility for Master and Admin account activity.",
    c4: "I agree to WorkRecord Terms and Privacy Policy.",
    submit: "Register company",
    submitting: "Registering…",
    back: "Back to home",
    error: "Registration failed. Check your details.",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
  },
};

export default function DaftarPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"id" | "en">("id");
  const t = copy[lang];

  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [businessField, setBusinessField] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [relationRole, setRelationRole] =
    useState<PartnerRelationRole>("BAWAHAN");

  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [c4, setC4] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const payerRoleLabel = useMemo(() => {
    const isAtasan = relationRole === "BAWAHAN";
    return isAtasan ? t.atasan : t.bawahan;
  }, [relationRole, t.atasan, t.bawahan]);

  const termsOk = c1 && c2 && c3 && c4;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsOk) return;
    setLoading(true);
    setError(null);
    try {
      const partnerEmailTrimmed = partnerEmail.trim();
      const result = await registerCompany({
        companyName: companyName.trim(),
        companyPhone: companyPhone.trim(),
        businessField: businessField.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        personalPhone: personalPhone.trim(),
        partnerAccount: {
          fullName: partnerName.trim(),
          email: partnerEmailTrimmed,
          personalPhone: partnerPhone.trim(),
          relationRole,
        },
        terms: {
          companyInfoTrue: c1,
          authorizedRepresentative: c2,
          masterResponsibility: c3,
          termsAndPrivacy: c4,
        },
      });

      await Swal.fire({
        icon: "success",
        title: lang === "id" ? "Pendaftaran berhasil" : "Registration complete",
        html:
          lang === "id"
            ? `<p style="margin:0 0 12px;line-height:1.6">${result.message}</p><p style="margin:0;font-size:14px;color:#475569">Minta rekan memeriksa inbox dan folder spam, lalu buka tautan <strong>Atur kata sandi</strong> sebelum login.</p>`
            : `<p style="margin:0 0 12px;line-height:1.6">${result.message}</p><p style="margin:0;font-size:14px;color:#475569">Ask them to check inbox/spam for the password setup link before signing in.</p>`,
        confirmButtonText: lang === "id" ? "Lanjut login" : "Continue to sign in",
        confirmButtonColor: "#2459df",
      });

      router.push("/login?returnTo=/perusahaan/verifikasi");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      lang={lang}
      onLangChange={setLang}
      variant="register"
      contentClassName="auth-main-content--register"
    >
      <AuthBackLink href="/">{t.back}</AuthBackLink>

      <div className="auth-register-card">
        <AuthFormLogo />
        <h1 className="auth-card-title">{t.title}</h1>
        <p className="auth-card-lead">{t.subtitle}</p>

        <form className="register-form" onSubmit={onSubmit}>
          <section className="register-section-card">
            <h2>
              <span className="register-section-icon">
                <Building2 size={18} />
              </span>
              {t.company}
            </h2>
            <div className="register-grid">
              <label className="auth-field">
                <span>Nama perusahaan</span>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="PT Contoh Maju"
                />
              </label>
              <label className="auth-field">
                <span>Telepon perusahaan</span>
                <span className="auth-input-wrap">
                  <Phone size={18} className="auth-input-icon" aria-hidden />
                  <input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    required
                    minLength={8}
                    placeholder="021…"
                  />
                </span>
              </label>
              <label className="auth-field register-full">
                <span>Bidang usaha</span>
                <input
                  value={businessField}
                  onChange={(e) => setBusinessField(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  placeholder="Contoh: Manufaktur tekstil, Jasa logistik"
                />
                <span className="register-field-hint">
                  Ditampilkan pada verifikasi keanggotaan WorkRecord. Maks. 200
                  karakter.
                </span>
              </label>
            </div>
          </section>

          <section className="register-section-card">
            <h2>
              <span className="register-section-icon">
                <User size={18} />
              </span>
              {t.payer}
            </h2>
            <div className="register-grid">
              <label className="auth-field">
                <span>Nama lengkap</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>
              <label className="auth-field">
                <span>Email</span>
                <span className="auth-input-wrap">
                  <Mail size={18} className="auth-input-icon" aria-hidden />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </span>
              </label>
              <label className="auth-field">
                <span>Telepon pribadi</span>
                <span className="auth-input-wrap">
                  <Phone size={18} className="auth-input-icon" aria-hidden />
                  <input
                    value={personalPhone}
                    onChange={(e) => setPersonalPhone(e.target.value)}
                    required
                    minLength={8}
                  />
                </span>
              </label>
              <label className="auth-field">
                <span>Kata sandi</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min. 8 karakter"
                />
              </label>
            </div>
          </section>

          <section className="register-section-card">
            <h2>
              <span className="register-section-icon">
                <Users size={18} />
              </span>
              {t.partner}
            </h2>
            <p className="register-hint">{t.partnerHint}</p>
            <div className="role-pick">
              <label className="role-option">
                <input
                  type="radio"
                  name="relationRole"
                  checked={relationRole === "BAWAHAN"}
                  onChange={() => setRelationRole("BAWAHAN")}
                />
                <span>
                  Akun kedua sebagai <strong>{t.bawahan}</strong>
                </span>
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="relationRole"
                  checked={relationRole === "ATASAN"}
                  onChange={() => setRelationRole("ATASAN")}
                />
                <span>
                  Akun kedua sebagai <strong>{t.atasan}</strong>
                </span>
              </label>
            </div>
            <p className="register-role-auto">
              {t.yourRole} <strong>{payerRoleLabel}</strong>
            </p>
            <div className="register-grid">
              <label className="auth-field">
                <span>Nama lengkap</span>
                <input
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  required
                />
              </label>
              <label className="auth-field">
                <span>Email</span>
                <span className="auth-input-wrap">
                  <Mail size={18} className="auth-input-icon" aria-hidden />
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    required
                  />
                </span>
              </label>
              <label className="auth-field register-full">
                <span>Telepon</span>
                <span className="auth-input-wrap">
                  <Phone size={18} className="auth-input-icon" aria-hidden />
                  <input
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    required
                    minLength={8}
                  />
                </span>
              </label>
            </div>
          </section>

          <section className="register-section-card">
            <h2>
              <span className="register-section-icon">
                <ScrollText size={18} />
              </span>
              {t.terms}
            </h2>
            <div className="terms-scroll" tabIndex={0}>
              <h3>{companyTermsTitle}</h3>
              <p>{companyTermsIntro}</p>
              {companyTermsSections.map((sec) => (
                <div key={sec.title} className="terms-block">
                  <h4>{sec.title}</h4>
                  <p>{sec.body}</p>
                </div>
              ))}
            </div>
            <div className="terms-checks">
              <label>
                <input
                  type="checkbox"
                  checked={c1}
                  onChange={(e) => setC1(e.target.checked)}
                />
                {t.c1}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={c2}
                  onChange={(e) => setC2(e.target.checked)}
                />
                {t.c2}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={c3}
                  onChange={(e) => setC3(e.target.checked)}
                />
                {t.c3}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={c4}
                  onChange={(e) => setC4(e.target.checked)}
                />
                {t.c4}
              </label>
            </div>
          </section>

          {error && (
            <p className="auth-alert auth-alert-error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="button button-blue w-full auth-submit"
            disabled={loading || !termsOk}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {t.submitting}
              </>
            ) : (
              <>
                {t.submit}
                <ArrowUpRight size={18} />
              </>
            )}
          </button>

          <p className="auth-footer-note">
            {t.hasAccount}{" "}
            <Link href="/login" className="auth-inline-link">
              {t.signIn}
            </Link>
          </p>
        </form>
      </div>
    </AuthPageShell>
  );
}
