import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

/**
 * SEO Component - Manages page metadata for search engines
 *
 * Provides comprehensive SEO including:
 * - Title and description tags
 * - Open Graph tags for social sharing
 * - Twitter Card tags
 * - Canonical URLs
 * - Structured data (JSON-LD)
 */
export default function SEO({
  title = 'Smart Budget - AI-Powered Financial Management',
  description = 'Take control of your finances with Smart Budget. Track expenses, analyze spending patterns, and get AI-powered insights to achieve your financial goals.',
  keywords = 'budget app, finance tracker, expense tracker, financial planning, money management, ai budget, personal finance, spending analysis',
  ogImage = '/og-image.png',
  ogType = 'website',
  canonicalUrl = 'https://smartbudget.app',
  structuredData,
}: SEOProps) {
  const fullTitle = title.includes('Smart Budget') ? title : `${title} | Smart Budget`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Smart Budget" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Smart Budget" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@smartbudget" />

      {/* Additional SEO Tags */}
      <meta name="application-name" content="Smart Budget" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Smart Budget" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#4f46e5" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
