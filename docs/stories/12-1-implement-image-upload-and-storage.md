# Story 12.1: Implement Image Upload and Storage

**Epic:** Epic 12 - AI Bill Comparison Tool
**Story ID:** 12.1
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 12

---

## User Story

**As a** user,
**I want to** upload images of receipts/bills,
**So that** I can compare prices over time using AI.

---

## Acceptance Criteria

### AC1: Drag-and-Drop Upload Interface

**Given** I am on the Bill Comparison page
**When** I drag and drop an image or click to browse
**Then** the image is uploaded and previewed

**And** upload interface supports:
- Drag-and-drop area
- Click to browse file selector
- Accepted formats: JPG, PNG (max 5MB per image)
- Preview thumbnail after upload
- Delete uploaded image before submission

### AC2: Image Validation

**And** validation rules:
- File format: JPG, PNG only
- File size: Max 5MB
- Image dimensions: Min 200x200px, Max 4000x4000px
- Reject invalid files with error message

### AC3: Bill Images Table

**And** bill images stored in database:
```sql
CREATE TABLE bill_images (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  comparison_id INTEGER,
  image_data TEXT, -- base64 encoded
  file_name VARCHAR(255),
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### AC4: Image Storage Strategy

**And** images stored as base64 in database (for MVP) or file path for future file storage

### AC5: Tier-Based Comparison Limits

**And** tier limits enforced:
- Free: 1 comparison per day (2 images)
- Basic: 10 comparisons per day
- Pro: Unlimited comparisons

### AC6: Upload Progress Indicator

**And** upload shows progress:
- Progress bar during upload
- Success checkmark when complete
- Error state with retry option

---

## Prerequisites

- Story 10.1 (subscription tiers)

---

## Technical Notes

- Store images as base64 for MVP (simpler)
- Future: Use S3 or cloud storage for production
- Compress images before upload (client-side) to reduce size
- Generate thumbnail for preview (200x200px)
- Consider using Multer for file uploads
- Clean up orphaned images (no comparison_id after 24h)
- Security: Validate image content (not just extension)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Drag-and-drop upload working
- [ ] Image validation functional
- [ ] bill_images table created
- [ ] Image storage implemented
- [ ] Tier limits enforced
- [ ] Progress indicator displayed
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
