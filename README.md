# AstroDesk Report Studio V0.4

V0.4 adds a selectable astrology calculation library and custom PDF builder.

## Vedic Astrology
Selectable:
- Birth Details / Nakshatra
- Planet Positions
- Vimshottari Dasha
- Raja Yoga
- Mangal Dosha
- Kaal Sarp Dosha
- Sade Sati
- Sarvashtakavarga
- Panchang
- Upagraha Positions
- D1, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60, Bhava and Hora charts

## KP Astrology
Selectable:
- KP Planet + Cusp Positions
- Planet Significators
- House Significators
- KP Chart
- Vimshottari Dasha
- KP or KP-New ayanamsa

## Horary / KP Prashna
- Question
- Horary Number 1–249 is stored
- Exact Time of Taking Number
- Exact Time of Judgment
- Two separate Ruling Planet sets:
  1. Lagna Lord
  2. Lagna Star Lord
  3. Moon Sign Lord
  4. Moon Star Lord
  5. Day Lord
- Judgment-time KP chart, positions, planet/house significators and Dasha

### Horary limitation
The currently documented Prokerala API exposes KP calculations by datetime/location, but no dedicated operation that converts a 1–249 Horary Number directly into the number-based horary ascendant/cusps. V0.4 therefore stores the number and implements the two-time Ruling Planet + judgment workflow without pretending that the number-based chart engine is available.

## PDF Builder
After calculations:
- Check/uncheck sections
- Drag or use up/down buttons to reorder
- Add the astrologer's own interpretation
- Branded Print / Save PDF

## Environment variables on Vercel
- `PROKERALA_CLIENT_ID`
- `PROKERALA_CLIENT_SECRET`

Never commit the secret.

## Prototype login
- Email: `astro@example.com`
- Password: `Astro123!`
