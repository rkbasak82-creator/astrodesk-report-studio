# AstroDesk Report Studio V0.3

Cloud-ready Vercel prototype for professional astrologers.

## Product scope
- Birth details and Prokerala location autocomplete
- Real Prokerala horoscope calculations: Birth Details, Planet Position, D1/Rashi, D9/Navamsa, Vimshottari Dasha
- Free-form Word/Google Docs-style report editor
- Voice-to-text in supported browsers
- Translation and language-polish buttons reserved for the next integration step
- Astrologer branding and browser PDF/print flow
- No CRM, booking, lead management, or automatic astrology prediction

## Vercel environment variables
Add these in Vercel Project Settings → Environment Variables:

- `PROKERALA_CLIENT_ID`
- `PROKERALA_CLIENT_SECRET`

Never commit the Client Secret to GitHub.

## Prokerala Authorized JavaScript Origin
After Vercel gives the project a live URL, add its origin in the Prokerala app dashboard, for example:

`https://your-project.vercel.app`

The location widget uses the public Client ID. Horoscope calls use the Client Secret only inside the Vercel serverless function.

## Prototype login
- Email: `astro@example.com`
- Password: `Astro123!`

Production authentication/database will be added later.
