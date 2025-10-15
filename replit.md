# Tennis Club Voice AI Receptionist

A professional voice-to-voice AI receptionist system for tennis clubs that handles incoming calls, manages court bookings, and provides club information using Twilio and OpenAI's Realtime API.

## Project Overview

**Purpose**: Automate tennis club reception with an intelligent voice AI that can:
- Answer incoming phone calls naturally
- Help members book tennis courts
- Provide club information (hours, amenities, pricing)
- Forward complex calls to staff when needed
- Track all call history and bookings in a dashboard

**Current State**: MVP complete with full voice AI integration, real-time call monitoring, booking management, and settings configuration.

## Architecture

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Wouter (routing), TanStack Query
- **Backend**: Express.js, Node.js, WebSocket (ws), Express-WS
- **Integrations**: 
  - Twilio (phone system via Replit connector)
  - OpenAI Realtime API (voice AI conversations)
- **Storage**: In-memory storage (MemStorage)

### Key Features
1. **Voice AI Receptionist**
   - Real-time voice-to-voice conversations via OpenAI Realtime API
   - Custom AI instructions configurable per club
   - Twilio Media Streams for audio handling
   - Automatic call routing and forwarding

2. **Dashboard**
   - Live call monitoring with real-time updates
   - Court booking management with conflict detection
   - Call history with search and filtering
   - Club settings configuration

3. **Real-time Communication**
   - WebSocket server for live updates
   - Bidirectional audio streaming (Twilio ↔ OpenAI)
   - Live call status updates to dashboard

## Project Structure

### Frontend (`client/src/`)
- **pages/**: All main application pages
  - `dashboard.tsx`: Overview with stats and recent activity
  - `live-calls.tsx`: Real-time active call monitoring
  - `bookings.tsx`: Court booking management
  - `call-history.tsx`: Searchable call log
  - `settings.tsx`: Club configuration and AI setup
- **components/**: Reusable UI components and app structure
  - `app-sidebar.tsx`: Navigation sidebar
  - `theme-provider.tsx`: Dark/light mode support
  - `theme-toggle.tsx`: Theme switcher

### Backend (`server/`)
- **routes.ts**: All API endpoints and WebSocket handling
  - `/api/calls`: Call management endpoints
  - `/api/bookings`: Booking CRUD operations
  - `/api/settings`: Club settings management
  - `/api/twilio/*`: Twilio webhooks and Media Stream
  - `/ws`: WebSocket for real-time updates
- **storage.ts**: In-memory data storage interface
- **twilio-client.ts**: Twilio SDK authentication via Replit connector
- **openai-realtime.ts**: OpenAI Realtime API client wrapper

### Shared (`shared/`)
- **schema.ts**: TypeScript types and Zod schemas for all data models

## Data Models

### Call
- Tracks all incoming calls with status, duration, outcome
- Links to bookings when a booking is made during call

### Booking
- Court reservations with date, time, member info
- Conflict detection to prevent double-bookings

### ClubSettings
- Club name, hours, phone number
- Number of courts available
- Call forwarding configuration
- Custom AI instructions

## API Endpoints

### Calls
- `GET /api/calls` - Get all calls
- `POST /api/calls` - Create new call record

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking (with conflict check)
- `DELETE /api/bookings/:id` - Cancel a booking

### Settings
- `GET /api/settings` - Get club settings
- `PUT /api/settings` - Update club settings

### Twilio Webhooks
- `POST /api/twilio/incoming` - Handle incoming calls
- `POST /api/twilio/status` - Call status updates
- `WS /api/twilio/media-stream` - Real-time audio streaming

## WebSocket Events

### Client → Server
- `end_call`: End an active call
- `forward_call`: Forward call to staff number

### Server → Client
- `call_update`: Live call status update
- `call_ended`: Call has ended

## Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for Realtime API
- `SESSION_SECRET`: Express session secret
- Twilio credentials managed via Replit connector

## User Preferences

- **Design**: Professional dashboard with dark mode default
- **Theme**: Tennis green (#8EC63F) as primary color
- **Layout**: Sidebar navigation with collapsible menu
- **Typography**: Inter for UI, JetBrains Mono for phone numbers

## Recent Changes

- **2025-10-14**: Initial MVP implementation
  - Built complete frontend with all pages and components
  - Implemented Twilio + OpenAI Realtime integration
  - Added WebSocket real-time updates
  - Created booking system with conflict detection
  - Configured club settings management

## Running the Project

```bash
npm run dev
```

The application runs on port 5000 and serves both frontend and backend.

## Twilio Setup

1. Configure Twilio phone number in Replit connector
2. Set webhook URL to: `https://<your-repl>.replit.dev/api/twilio/incoming`
3. Set status callback to: `https://<your-repl>.replit.dev/api/twilio/status`
