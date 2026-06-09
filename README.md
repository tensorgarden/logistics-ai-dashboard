# Logistics AI Dashboard

**Shipment tracking, route optimization, carrier management, and freight analytics** -- an AI-powered operations console for logistics and freight companies.

## The Problem

Logistics teams operate with severe visibility gaps. Shipments cross multiple carriers, modes, and borders, but the data lives in silos -- carrier portals, spreadsheets, email threads, and phone calls. When a shipment goes off track, ops managers discover it hours or days late, after the customer has already complained.

Carrier management is equally chaotic. Performance data is scattered. Teams rely on gut feel instead of data when choosing between Atlas Freight (96% on-time, 3.2-day average) and Global Maritime (72% on-time, 9.4-day average). Underperforming carriers fly under the radar until a major incident forces a review.

Customs holds are the worst blind spot. A shipment worth $312,000 sits in Rotterdam for three days because of a missing HS code declaration, and nobody knows until the customer calls. These visibility failures cost real money -- expedited shipping, penalty clauses, lost customers.

## What This Dashboard Does

The Logistics AI Dashboard brings everything into one pane of glass:

- **Real-time shipment tracking** across all carriers with status dots, last-known location, and ETA
- **Carrier performance scorecards** with on-time rate, average transit days, active shipments, and quality ratings
- **Route optimization** comparing segments, modes (road/rail/air/sea), distances, and transit hours
- **Delivery timeline** with chronological tracking events, timestamps, and location data
- **Alert panel** surfacing delayed and customs-held shipments with the latest status description
- **Hero stats** showing active shipments, on-time rate, average transit days, and active alerts at a glance

## Stack

- **Next.js 15** (App Router) with React 19
- **TypeScript** strict mode
- **Tailwind CSS** with a custom slate/indigo palette
- **Vitest** for unit tests (10 data integrity tests)
- **ESLint** with next/core-web-vitals

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # vitest run
npm run build      # production build
```

## Quality Gates

```bash
npm run lint       # eslint --max-warnings=0
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run build      # next build
```

## Data

All data is fictional demo content. No production keys, no network calls, no real customer information. Shipments, carriers, routes, and tracking events are generated for portfolio demonstration purposes.

## License

Private portfolio demo -- all rights reserved.
