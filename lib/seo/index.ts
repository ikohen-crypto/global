import type { Metadata } from "next";

const brandName = "GlobalEcon";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl()).toString();
}

export function buildMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title: `${title} | ${brandName}`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | ${brandName}`,
      description,
      url: canonical,
      siteName: brandName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: absoluteUrl(`/opengraph-image?title=${encodeURIComponent(title)}`),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brandName}`,
      description,
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildDatasetJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    url: absoluteUrl(path),
    creator: {
      "@type": "Organization",
      name: brandName,
    },
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: `${brandName} World Economy Data`,
    },
    isBasedOn: ["World Bank Open Data", "OECD SDMX API", "REST Countries"],
  };
}
