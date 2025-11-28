# Story 6.4: Add SEO Optimization and Performance Improvements

**Epic:** Epic 6 - Public Landing Page & Lead Generation
**Story ID:** 6.4
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 6

---

## User Story

**As a** visitor,
**I want** the landing page to load quickly and rank well in search engines,
**So that** I can find and use the app easily.

---

## Acceptance Criteria

### AC1: SEO Meta Tags in HTML Head

**Given** the landing page is deployed
**When** search engines crawl the page
**Then** SEO metadata and performance optimizations are in place

**And** HTML head includes SEO meta tags (title, description, Open Graph, Twitter Card, keywords, canonical)

### AC2: Structured Data (JSON-LD)

**And** structured data (JSON-LD) for WebApplication schema

### AC3: Performance Optimizations

**And** performance optimizations:
- **Images:** WebP format, lazy loading, responsive srcset, max 200KB
- **Code:** Code splitting, minified CSS/JS, tree-shaking, preload critical fonts
- **Loading:** FCP < 1.8s, LCP < 2.5s, CLS < 0.1

### AC4: Accessibility Standards

**And** accessibility:
- Semantic HTML tags
- ARIA labels where needed
- Keyboard navigation support
- Alt text on all images
- Color contrast meets WCAG 2.1 AA

### AC5: Analytics Integration (Optional)

**And** analytics integration (optional):
- Google Analytics 4 setup
- Track CTA button clicks
- Track form submissions
- Track scroll depth

### AC6: Sitemap and Robots.txt

**And** sitemap.xml and robots.txt created

---

## Prerequisites

- Story 6.1 (landing page structure)
- Story 6.2 (animations)
- Story 6.3 (contact form)

---

## Technical Notes

- Use React Helmet for dynamic meta tags
- Generate OG images (1200x630px) for social sharing
- Test with Google Lighthouse (aim for 90+ score)
- Use Vite's asset optimization features
- Consider using CDN for static assets
- Test with Google Search Console after deployment
- Monitor Core Web Vitals
- Future: Add blog section for SEO content

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] SEO meta tags implemented
- [ ] Structured data added
- [ ] Performance targets met
- [ ] Accessibility standards met
- [ ] Lighthouse score > 90
- [ ] Sitemap and robots.txt created
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
