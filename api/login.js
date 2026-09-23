const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

const redis = new Redis({
  url: process.env.JFBARBER_STORAGE_KV_REST_API_URL,
  token: process.env.JFBARBER_STORAGE_KV_REST_API_TOKEN,
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'javibarber7';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const rlKey = `rate_limit_login:${ip}`;
    const reqs = await redis.incr(rlKey);
    if (reqs === 1) await redis.expire(rlKey, 60 * 15);
    
    if (reqs > 10) return res.status(429).json({ error: 'Too many login attempts' });
  } catch (e) {
    console.error('Rate limit error:', e);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(`session:${token}`, 'valid', { ex: 60 * 60 * 24 * 30 }); // 30 días TTL
    return res.status(200).json({ token });
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
