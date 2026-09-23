const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.JFBARBER_STORAGE_KV_REST_API_URL,
  token: process.env.JFBARBER_STORAGE_KV_REST_API_TOKEN,
});

const BOOKINGS_KEY = 'jfbarber_bookings';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authHeader = req.headers.authorization;
  const hasToken = authHeader && authHeader.trim() !== 'Bearer' && authHeader.trim() !== 'Bearer null' && authHeader.trim() !== 'Bearer invalid_token';

  let isAdmin = false;
  if (hasToken) {
    const token = authHeader.replace('Bearer ', '').trim();
    const valid = await redis.get(`session:${token}`);
    if (valid === 'valid') {
      isAdmin = true;
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Rate Limiting Básico (Anti-Spam)
  // No bloquear al administrador legítimo
  if (!isAdmin) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
      const rlKey = `rate_limit:${ip}`;
      const reqs = await redis.incr(rlKey);
      if (reqs === 1) await redis.expire(rlKey, 60 * 15);
      
      if (reqs > 5) {
          if (req.method === 'POST') return res.status(429).json({ error: 'Too many requests' });
      }
    } catch (e) {
      console.error('Rate limit error:', e);
    }
  }

  try {
    let bookings = await redis.get(BOOKINGS_KEY);
    if (!bookings) bookings = [];

    let migrated = false;
    bookings.forEach(b => {
      if (!b.fullDate) {
        b.fullDate = new Date(b.timestamp || Date.now()).toISOString().split('T')[0];
        migrated = true;
      }
    });
    if (migrated) {
      await redis.set(BOOKINGS_KEY, bookings);
    }

    if (req.method === 'GET') {
      if (req.query.verify === '1') {
         return res.status(isAdmin ? 200 : 401).json({ valid: isAdmin });
      }

      if (isAdmin) {
        return res.status(200).json(bookings);
      } else {
        const sanitized = bookings.map(b => ({
          id: b.id,
          date: b.date,
          fullDate: b.fullDate,
          time: b.time,
          status: b.status
        }));
        return res.status(200).json(sanitized);
      }
    } 
    
    if (req.method === 'POST') {
      const newBooking = req.body;
      if (!newBooking.clientName || !newBooking.phone || !newBooking.fullDate || !newBooking.time) {
          return res.status(400).json({ error: 'Missing required fields' });
      }

      newBooking.id = Date.now().toString() + Math.random().toString(36).substring(7);
      newBooking.status = isAdmin ? 'accepted' : 'pending';
      newBooking.timestamp = Date.now();

      if (isAdmin) {
          const lockKey = `slot:${newBooking.fullDate}:${newBooking.time}`;
          const acquired = await redis.set(lockKey, 'locked', { nx: true });
          if (!acquired) {
              return res.status(409).json({ error: 'Slot already taken' });
          }
      }

      bookings.push(newBooking);
      await redis.set(BOOKINGS_KEY, bookings);

      if (!isAdmin) {
          return res.status(200).json({ success: true, booking: { id: newBooking.id, status: newBooking.status } });
      }

      return res.status(200).json({ success: true, booking: newBooking });
    }

    if (req.method === 'PUT') {
      if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });

      const { id, status } = req.body;
      const index = bookings.findIndex(b => b.id === id);
      
      if (index > -1) {
        const booking = bookings[index];

        if (status === 'accepted') {
            const lockKey = `slot:${booking.fullDate}:${booking.time}`;
            const acquired = await redis.set(lockKey, 'locked', { nx: true });
            if (!acquired) {
                return res.status(409).json({ error: 'Slot already taken' });
            }
        } else if (status === 'rejected' && booking.status === 'accepted') {
            const lockKey = `slot:${booking.fullDate}:${booking.time}`;
            await redis.del(lockKey);
        }

        bookings[index].status = status;
        await redis.set(BOOKINGS_KEY, bookings);
        return res.status(200).json({ success: true });
      } else {
        return res.status(404).json({ error: 'Not found' });
      }
    }

  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
