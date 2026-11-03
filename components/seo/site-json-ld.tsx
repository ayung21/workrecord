import { seoCopy } from "@/lib/seo/default-metadata";
import { getSiteUrl } from "@/lib/seo/site-url";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: seoCopy.siteName,
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description: seoCopy.defaultDescription,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: seoCopy.siteName,
        description: seoCopy.defaultDescription,
        inLanguage: "id-ID",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
