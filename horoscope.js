const { DateTime } = require('luxon');

const BASE = 'https://api.prokerala.com';
let tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 60000) return tokenCache.token;

  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Prokerala environment variables are missing.');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Prokerala authentication failed (${response.status}): ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  tokenCache = {
    token: data.access_token,
    expiresAt: now + (Number(data.expires_in || 3600) * 1000)
  };
  return tokenCache.token;
}

async function apiGet(path, params, accept = 'application/json') {
  const token = await getToken();
  const url = new URL(`${BASE}/v2${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: accept }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} failed (${response.status}): ${text.slice(0, 500)}`);
  if (accept === 'image/svg+xml') return text;
  return JSON.parse(text);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { date, time, coordinates, timezone, ayanamsa = 1, language = 'en', chartStyle = 'north-indian' } = req.body || {};
    if (!date || !time || !coordinates || !timezone) {
      return res.status(400).json({ error: 'Date, time, place coordinates and timezone are required.' });
    }

    const local = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
    if (!local.isValid) return res.status(400).json({ error: `Invalid birth date/time: ${local.invalidExplanation || 'unknown error'}` });
    const datetime = local.toISO({ suppressMilliseconds: true });

    const common = { ayanamsa, coordinates, datetime, la: language };
    const [birthDetails, planetPosition, dashaPeriods, rasiChartSvg, navamsaChartSvg] = await Promise.all([
      apiGet('/astrology/birth-details', common),
      apiGet('/astrology/planet-position', { ...common, planets: '0,1,2,3,4,5,6,100,101,102' }),
      apiGet('/astrology/dasha-periods', { ...common, year_length: 1 }),
      apiGet('/astrology/chart', { ...common, chart_type: 'rasi', chart_style: chartStyle, format: 'svg' }, 'image/svg+xml'),
      apiGet('/astrology/chart', { ...common, chart_type: 'navamsa', chart_style: chartStyle, format: 'svg' }, 'image/svg+xml')
    ]);

    res.status(200).json({
      input: { datetime, coordinates, timezone, ayanamsa, language, chartStyle },
      birthDetails,
      planetPosition,
      dashaPeriods,
      rasiChartSvg,
      navamsaChartSvg
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Unexpected server error.' });
  }
};
