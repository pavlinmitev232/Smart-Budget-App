# Sprint 3 Candidates

Future improvements and technical debt items to consider for Sprint 3.

---

## Infrastructure & Scalability

### 1. Migrate Bill Image Storage to Cloud Storage
**Priority:** High
**Type:** Technical Debt / Scalability

**Current State:**
- Bill images are stored as base64-encoded text directly in PostgreSQL (`bill_images.image_data`)
- Simple MVP approach but causes database bloat

**Proposed Solution:**
- Migrate to AWS S3, Google Cloud Storage, or Azure Blob Storage
- Store only the URL/key in the database
- Use signed URLs for secure, time-limited access
- Add image compression/optimization on upload

**Benefits:**
- Reduced database size and faster queries
- Better scalability for production workloads
- CDN integration for faster image delivery
- Cost-effective storage for large files

**Estimated Effort:** Medium (1-2 stories)

---

## Notes
- Add new candidates below as they're identified during development
- Prioritize based on user impact and technical necessity
