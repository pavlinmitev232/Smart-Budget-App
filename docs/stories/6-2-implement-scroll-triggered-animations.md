# Story 6.2: Implement Scroll-Triggered Animations

**Epic:** Epic 6 - Public Landing Page & Lead Generation
**Story ID:** 6.2
**Status:** done
**Created:** 2025-11-25
**Completed:** 2025-11-29
**Sprint:** Phase 2, Epic 6

---

## User Story

**As a** visitor,
**I want to** see smooth animations as I scroll through the landing page,
**So that** the experience feels modern and engaging.

---

## Acceptance Criteria

### AC1: Framer Motion Integrated

**Given** I am viewing the landing page
**When** I scroll down the page
**Then** sections and elements animate into view

**And** Framer Motion is integrated: `npm install framer-motion`

### AC2: Animation Patterns Implemented

**And** animation patterns implemented:
1. **Fade In on Scroll:** Feature cards fade in as they enter viewport (staggered)
2. **Slide Up on Scroll:** Section headings slide up from below
3. **Scale on Scroll:** Images/icons scale from 0.8 to 1.0
4. **Hero Section Animations (on load):** Heading fades in from top, subtext with delay, CTA buttons slide up with bounce

### AC3: Specific Animations by Section

**And** specific animations by section:
- **Hero:** Fade in on load
- **Features:** Staggered fade + slide up
- **How It Works:** Slide from left (step 1), center (step 2), right (step 3)
- **Pricing:** Scale up on scroll
- **Contact:** Fade in

### AC4: Animation Quality Standards

**And** animations are:
- Smooth and not jarring (0.4-0.8s duration)
- Triggered once (not on every scroll)
- Respect `prefers-reduced-motion` accessibility setting
- Performance optimized (use `transform` and `opacity` only)

### AC5: Mobile Animation Optimization

**And** mobile animations:
- Simplified animations (fewer effects)
- Faster animation duration (0.3-0.5s)
- Less vertical offset to avoid layout shift

---

## Prerequisites

- Story 6.1 (landing page structure exists)

---

## Technical Notes

- Use `useInView` hook to detect when elements enter viewport
- Set `once: true` to prevent re-triggering on scroll up
- Use `margin: "-100px"` to trigger animations slightly before element is fully visible
- Avoid animating too many properties (impacts performance)
- Test on lower-end devices for smooth 60fps animations
- Consider using `will-change` CSS property sparingly
- Future: Add parallax effect on hero background (optional)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Framer Motion installed and configured
- [ ] All animation patterns working
- [ ] Animations respect accessibility preferences
- [ ] Performance optimized (60fps)
- [ ] Mobile animations simplified
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
