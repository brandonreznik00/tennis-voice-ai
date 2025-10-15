# Design Guidelines: Tennis Club Voice AI Receptionist

## Design Approach

**Selected Approach**: Design System + Dashboard Pattern  
**Justification**: As a utility-focused business tool for managing calls, bookings, and club operations, this application prioritizes efficiency, clarity, and data accessibility over visual marketing appeal.

**Primary References**: 
- Twilio Console (telephony context familiarity)
- Linear (clean data presentation, modern aesthetics)
- Vercel Dashboard (elegant minimalism for technical tools)

**Core Principles**:
- Clarity over decoration - every element serves a functional purpose
- Immediate information access - critical data visible without clicks
- Professional polish suitable for business context
- Real-time status visibility for active calls and system health

---

## Color Palette

**Dark Mode Primary** (default):
- Background: 222 10% 10%
- Surface: 222 10% 14%
- Surface Elevated: 222 10% 18%
- Border: 222 10% 25%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

**Light Mode**:
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Border: 220 13% 91%
- Text Primary: 222 47% 11%
- Text Secondary: 215 14% 34%

**Brand/Accent Colors**:
- Primary (Tennis Green): 142 76% 36%
- Primary Hover: 142 76% 30%
- Success: 142 71% 45%
- Warning: 38 92% 50%
- Error: 0 72% 51%
- Info: 217 91% 60%

**Status Indicators**:
- Active Call: 142 76% 36% (pulsing)
- Idle: 215 14% 34%
- Ringing: 38 92% 50% (animated)
- Forwarded: 217 91% 60%

---

## Typography

**Font Families**:
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts)
- Monospace: 'JetBrains Mono', monospace (for phone numbers, call IDs)

**Scale**:
- Headings: font-semibold
  - H1: text-3xl (30px) - Dashboard titles
  - H2: text-2xl (24px) - Section headers
  - H3: text-xl (20px) - Card headers
- Body: font-normal
  - Large: text-base (16px) - Primary content
  - Regular: text-sm (14px) - Secondary content, labels
  - Small: text-xs (12px) - Metadata, timestamps
- Numbers/Data: font-medium with tabular-nums for alignment

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8** (e.g., p-4, gap-6, mb-8)
- Micro spacing (within components): 2, 4
- Component spacing: 4, 6
- Section spacing: 6, 8
- Page margins: 8

**Grid Structure**:
- Sidebar Navigation: 64px collapsed, 240px expanded (fixed left)
- Main Content: flex-1 with max-w-7xl container
- Responsive: Stack to single column on mobile, expand to 2-3 columns on desktop

**Dashboard Layout**:
- Top: Status bar showing system health, active calls count (h-16)
- Left: Collapsible sidebar navigation
- Main: Grid of cards and tables with consistent gap-6
- Cards: Rounded borders (rounded-lg), subtle shadows

---

## Component Library

**Navigation**:
- Sidebar with icon + label pattern
- Active state: Primary color background with subtle glow
- Sections: Dashboard, Live Calls, Bookings, Schedule, Settings, Analytics

**Data Display**:
- **Call Log Table**: Striped rows, hover states, sortable columns
  - Columns: Timestamp, Caller, Duration, Status, Action, Outcome
  - Status badges with color coding
- **Real-time Call Cards**: Elevated surface with live status indicator
  - Caller info, duration timer, action buttons (transfer, end, notes)
- **Booking Calendar**: Week/month view with time slots
  - Available (green outline), Booked (filled green), Blocked (gray)
- **Statistics Cards**: Grid of metrics (total calls, bookings today, avg duration)
  - Large numbers with trend indicators (↑↓ arrows with percentages)

**Forms**:
- Input fields: Dark background with lighter border, focus ring in primary color
- Dropdowns: Custom styled select with chevron icon
- Time pickers: Tennis court-specific time slots
- Toggle switches: Primary color when active

**Buttons**:
- Primary: bg-primary with hover state, rounded-md, px-6 py-2
- Secondary: border with bg-transparent, hover bg-surface-elevated
- Danger: Red color for critical actions (end call, delete)
- Icon buttons: Square aspect ratio, subtle hover bg

**Status Indicators**:
- Pulse animation for active calls
- Badge components for call outcomes (Completed, Missed, Forwarded, Voicemail)
- Health status dot in top bar (green = operational, yellow = degraded, red = down)

**Overlays**:
- Modal for call notes, booking details (max-w-2xl, centered)
- Slide-over panel for settings, call details (right side, w-96)
- Toast notifications for events (top-right, auto-dismiss)

---

## Animations

**Minimal & Purposeful**:
- Pulse effect on active call indicators
- Smooth transitions on navigation (transition-all duration-200)
- Fade-in for real-time updates (opacity transitions)
- NO decorative animations - all motion serves functional purpose

---

## Images

**No hero images needed** - This is a dashboard application focused on data and functionality.

**Icon Usage**:
- Heroicons for UI elements (phone, calendar, clock, users, settings)
- Status icons within badges and indicators
- Navigation icons in sidebar

**Visual Elements**:
- Subtle background patterns on empty states only
- Tennis ball icon as brand element in top nav
- Placeholder illustrations for zero states (empty call log, no bookings)

---

## Key Screens

1. **Dashboard Home**: Grid of stat cards + recent calls table + today's bookings
2. **Live Calls**: Real-time view of active calls with action controls
3. **Bookings**: Calendar view + booking list with filters
4. **Call History**: Detailed log table with search, filters, export
5. **Settings**: AI configuration, club hours, forwarding rules, integrations
6. **Analytics**: Charts for call volume, peak hours, booking trends

**Consistency**: Every screen maintains the sidebar + top bar + main content area structure with consistent spacing and visual hierarchy.