# AstroDesk Report Studio V0.5

V0.5 changes the report output to a fixed professional **2-page PDF**.

## Final PDF structure

### Page 1 — Structured Astrology Summary
- Logo
- Brand / astrologer name
- Short tagline
- Website, Mobile, WhatsApp, Email
- Client Name, DOB, Time, Place
- Quick summary: Lagna, Rashi, Nakshatra, Pada, Gana, **Lagna Sub Lord (1SL)**
- Four astrologer-selectable blocks in a fixed 2×2 layout
- Astrologer signature and disclaimer

The four blocks can use any calculations already generated in the report, including Vedic charts, planet positions, Dasha, KP chart, KP significators, Horary items, etc.

### Page 2 — Personal Prediction
- Free-form Word/Google Docs style astrologer writing
- Exactly one prediction page is targeted
- Long text automatically uses a smaller font
- The software never generates astrology predictions automatically

## Systems
- Vedic Astrology
- KP Astrology
- Horary / KP Prashna

## Branding additions in V0.5
- Short tagline
- Separate Mobile and WhatsApp
- Logo upload
- Optional signature image

## Lagna Sub Lord
`Lagna Sub Lord (1SL)` means the **Sub Lord of the 1st cusp / Lagna**. It is read from the KP cusp calculation when KP data is available.

## Vercel environment variables
- `PROKERALA_CLIENT_ID`
- `PROKERALA_CLIENT_SECRET`

Never commit the Client Secret.

## Prototype login
- Email: `astro@example.com`
- Password: `Astro123!`
