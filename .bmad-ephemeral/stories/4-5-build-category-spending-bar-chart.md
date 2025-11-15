# Story 4.5: Build Category Spending Bar Chart

Status: done

## Story

As a user,
I want to see a horizontal bar chart ranking my spending by category,
So that I can quickly identify my top spending categories.

## Acceptance Criteria

**AC1:** Given I am authenticated and viewing the dashboard analytics, when I scroll to the category spending section, then I see a horizontal bar chart showing spending by category

**AC2:** The chart displays:
- Y-axis: Category names (sorted by amount, highest at top)
- X-axis: Amount spent (currency values)
- Bars colored consistently (single color or gradient)
- Shows top 10 categories (or fewer if less exist)
- Amount label at end of each bar

**AC3:** The chart responds to time period changes:
- Updates automatically when dashboard period filter changes
- Smooth animation when data changes
- Shows loading state during fetch

**AC4:** Interactive features:
- Hover shows exact amount and transaction count
- Optional: Click bar to filter transaction list to that category

**AC5:** Responsive behavior:
- Desktop: horizontal layout, ~400-500px height
- Mobile: may switch to vertical bars or remain horizontal with scroll

**AC6:** Empty state: If no expenses, show "No expense data for this period"

## Tasks / Subtasks

- [x] **Task 1: Create Category Bar Chart Component** (AC: #1, #2)
  - [x] Create `frontend/src/components/dashboard/CategoryBarChart.tsx`
  - [x] Props: data, isLoading, timePeriod
  - [x] Import Recharts BarChart
  - [x] Configure horizontal layout

- [x] **Task 2: Fetch Category Data** (AC: #1)
  - [x] Call GET /api/analytics/category-breakdown?type=expense
  - [x] Pass startDate and endDate
  - [x] Sort by amount descending
  - [x] Limit to top 10 categories
  - [x] Transform for Recharts format

- [x] **Task 3: Render Horizontal Bar Chart** (AC: #2)
  - [x] Create BarChart with layout="horizontal"
  - [x] Y-axis: category names
  - [x] X-axis: amounts with currency formatting
  - [x] Single Bar component with consistent color
  - [x] Add amount labels at end of bars

- [x] **Task 4: Implement Tooltips** (AC: #4)
  - [x] Create custom tooltip
  - [x] Show category name
  - [x] Show exact amount (formatted currency)
  - [x] Show transaction count
  - [x] Style with Tailwind CSS

- [x] **Task 5: Make Chart Responsive** (AC: #5)
  - [x] Use ResponsiveContainer
  - [x] Test horizontal layout on mobile
  - [x] Consider vertical bars as fallback on very small screens
  - [x] Ensure scrollable if needed

- [x] **Task 6: Implement Empty State** (AC: #6)
  - [x] Check if data is empty
  - [x] Show "No expense data for this period"
  - [x] Add icon or illustration

- [x] **Task 7: Integrate with Dashboard** (AC: #3)
  - [x] Add CategoryBarChart to Dashboard page
  - [x] Pass time period state
  - [x] Re-fetch when period changes
  - [x] Show loading spinner
  - [x] Section title: "Top Spending Categories"

- [x] **Task 8: Style and Polish** (AC: #2, #5)
  - [x] Apply Tailwind CSS styling
  - [x] Card/section container
  - [x] Choose bar color (indigo theme)
  - [x] Smooth animations
  - [x] Proper spacing and padding

- [x] **Task 9: Test Bar Chart** (AC: #1-6)
  - [x] Test with expense data
  - [x] Test with >10 categories (verify only top 10 shown)
  - [x] Test with <10 categories
  - [x] Test tooltips
  - [x] Test empty state
  - [x] Test responsive layout
  - [x] Test time period changes

## Dev Notes

### Architecture Alignment

**Chart Configuration:**
```typescript
<BarChart
  layout="horizontal"
  data={categoryData}
  width={600}
  height={400}
>
  <XAxis type="number" />
  <YAxis type="category" dataKey="category" width={150} />
  <Tooltip content={<CustomTooltip />} />
  <Bar dataKey="amount" fill="#6366f1" />
</BarChart>
```

**Data Transformation:**
```typescript
const topCategories = categoryData
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 10);
```

### Learnings from Previous Stories

**From Story 4.1 (Status: drafted)**

- Analytics API returns sorted category breakdown
- Endpoint: GET /api/analytics/category-breakdown?type=expense

**From Story 4.3 (Status: drafted)**

- Recharts library already installed
- Color palette established

[Source: stories/4-1-implement-analytics-api-endpoints-for-dashboard-data.md]

### Project Structure Notes

**New Files:**
```
frontend/src/components/dashboard/
└── CategoryBarChart.tsx
```

### Testing Standards

- Test chart renders with category data
- Test top 10 limit
- Test tooltips
- Test responsive behavior
- Test empty state

### References

- [Source: docs/epics.md#Epic-4-Story-4.5]
- [Source: docs/PRD.md#FR-DASH-004-Category-Analysis]
- [Source: stories/4-1-implement-analytics-api-endpoints-for-dashboard-data.md]

## Dev Agent Record

### Context Reference

No context file available - proceeded with story file and patterns from Stories 4.3 and 4.4

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References

- Reused category-breakdown API from Story 4.3
- Similar data structure handling as previous chart components
- Dynamic height calculation based on category count (categoryData.length * 50, min 300px)
- Recharts library already installed

### Completion Notes List

**Implementation Summary:**
- Created CategoryBarChart component with all required features:
  - Fetches category data from `/api/analytics/category-breakdown?type=expense`
  - Displays horizontal bar chart with categories sorted by amount (highest first)
  - Top 10 categories limit to prevent overcrowding
  - Custom tooltips showing category, amount (USD), transaction count, and percentage
  - Empty state with helpful message and icon
  - Loading and error states
  - Responsive design with ResponsiveContainer
  - Dynamic height based on data (50px per category, minimum 300px)
  - X-axis formatted as currency
  - Y-axis shows category names (110px width)
  - Amount labels displayed at end of each bar
  - Indigo color scheme (#6366f1) matching app theme
  - Smooth 800ms animations
- Integrated chart into Dashboard page in a 2-column grid with pie chart
- Chart updates automatically when time period changes
- All 6 acceptance criteria validated

**Technical Decisions:**
- Horizontal layout for better category name readability
- Dynamic height prevents wasted space with few categories
- Grid layout with pie chart creates balanced visual design
- Amount labels on bars provide quick value reference without hovering
- Top 10 limit prevents chart from becoming too tall

### File List

**New Files:**
- `frontend/src/components/dashboard/CategoryBarChart.tsx`

**Modified Files:**
- `frontend/src/pages/Dashboard.tsx` (imported and integrated CategoryBarChart in 2-column grid)

## Change Log

- 2025-11-15: Story drafted by SM agent (Bob) from epics.md, architecture.md, and PRD.md
- 2025-11-15: Story implemented by DEV agent (Amelia) - All tasks completed, all acceptance criteria validated
