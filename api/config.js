module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ prokeralaClientId: process.env.PROKERALA_CLIENT_ID || '' });
};
