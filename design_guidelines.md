# GoAmpyWaitlistV5 Design Guidelines

## Design Approach
**Hybrid Strategy**: Modern SaaS landing page aesthetic (inspired by Linear, Vercel, Stripe) for public-facing waitlist + clean dashboard system for admin panel.

## Typography System
- **Primary Font**: Inter (Google Fonts) for UI and body text
- **Display Font**: Inter for headlines (tighter letter-spacing, heavier weights)
- **Hierarchy**:
  - Hero headline: text-6xl/text-7xl, font-bold, tracking-tight
  - Section headers: text-3xl/text-4xl, font-semibold
  - Card titles: text-xl, font-semibold
  - Body text: text-base/text-lg
  - UI labels: text-sm, font-medium
  - Captions/metadata: text-sm

## Layout System
**Spacing Scale**: Tailwind units 4, 6, 8, 12, 16, 24, 32 (p-4, gap-8, py-24, etc.)
- Section padding: py-20 (mobile) → py-32 (desktop)
- Container max-width: max-w-7xl
- Content blocks: max-w-4xl for centered content
- Card padding: p-6 → p-8
- Element spacing: gap-4 to gap-8 for related items

## Public Waitlist Landing Page Structure

### Hero Section (80vh min-height)
- **Layout**: Centered content with large background gradient mesh/abstract pattern image
- **Content Stack**:
  - Compact badge ("Join 2,000+ Early Adopters" with subtle pill styling)
  - Hero headline emphasizing exclusivity and benefit
  - Subheadline (2 lines max, text-xl)
  - Email signup form (inline: input + primary button)
  - Social proof row (logos or stat counters)
- **Form Design**: Large input field (h-12/h-14) with rounded-lg borders, button with backdrop-blur-md when over image

### Why Join Section (2-column on desktop)
- Left: Compelling copy block
- Right: 3 benefit cards in vertical stack
- Card pattern: Icon (heroicons via CDN) + title + 1-2 line description
- Cards: Subtle border, rounded-xl, p-6, hover:shadow-lg transition

### How It Works Section (3-column grid)
- Step cards numbered 1-2-3
- Each card: Large number, icon, title, description
- Progressive visual flow (left to right)
- grid-cols-1 md:grid-cols-3, gap-8

### Referral Incentive Section (Full-width with gradient background)
- Centered content block explaining referral system
- Visual: Mockup of referral link interface or leaderboard preview
- Tiered rewards displayed in 3-4 columns
- Strong CTA button

### Leaderboard Preview (Top 10)
- Table-style layout with rank, name/email (anonymized), referral count
- Highlight top 3 positions with subtle badges
- "See where you rank" CTA below

### Final CTA Section
- Centered, bold headline
- Repeated signup form (same design as hero)
- Trust indicators (security badges, privacy statement)

## Admin Dashboard

### Layout Pattern
- Sidebar navigation (w-64, fixed left)
  - Logo/branding top
  - Nav items with icons
  - Stats summary at bottom
- Main content area (ml-64, full remaining width)
  - Top bar: Page title, filters, actions
  - Content area with cards/tables

### Dashboard Cards
- Stats cards in 4-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Card design: White/surface bg, rounded-lg, p-6, shadow-sm
- Layout: Large number (text-3xl, font-bold) + label + trend indicator

### Data Tables
- Clean, striped rows for readability
- Sticky header on scroll
- Row actions on hover (right-aligned icons)
- Pagination controls below
- Sortable columns with visual indicators

### Referral Analytics
- Chart area using Chart.js library
- 2-column layout: Graph (2/3 width) + Top referrers list (1/3 width)
- Filter controls above charts

## Component Library

### Buttons
- **Primary**: px-6 py-3, rounded-lg, font-semibold, shadow-sm
- **Secondary**: Same sizing, border-2, transparent bg
- **Icon buttons**: w-10 h-10, rounded-full for actions

### Form Inputs
- Height: h-12
- Border: border-2, rounded-lg
- Focus state: ring-2 offset for accessibility
- Label above input (text-sm, font-medium, mb-2)

### Cards
- Base: rounded-xl, border or shadow-sm
- Padding: p-6 to p-8
- Hover states: shadow-md transition for interactive cards

### Badges/Pills
- px-3 py-1, rounded-full, text-sm, font-medium
- Use for status indicators, categories

### Icons
- Library: Heroicons (via CDN)
- Sizes: w-5 h-5 (inline), w-6 h-6 (buttons), w-12 h-12 (feature icons)

## Images

### Hero Background
Large abstract gradient mesh or geometric pattern (full-width, positioned behind content). Subtle, non-distracting, provides depth. Can be generated pattern or stock abstract imagery.

### Optional Supporting Images
- Mockup of referral dashboard in "How It Works" section
- Abstract illustration for referral incentive section
- No photography unless showing product UI

## Animations
**Minimal approach**: 
- Fade-in on scroll for section reveals (subtle, once)
- Smooth transitions on hover states (shadow, scale)
- No distracting motion graphics

## Accessibility
- Consistent focus indicators (ring-2) on all interactive elements
- Proper heading hierarchy (h1 → h6)
- ARIA labels for icon-only buttons
- Form labels always visible
- Minimum contrast ratios maintained through design system

**Key Principle**: The landing page should feel modern and aspirational while the admin dashboard prioritizes clarity and efficiency. Balance visual appeal with functional utility.