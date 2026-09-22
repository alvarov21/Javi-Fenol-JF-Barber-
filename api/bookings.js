const { Redis } = require('@upstash/redis');

// Initialize Redis using the variables injected by Vercel Upstash Integration
const redis = new Redis({
  url: process.env.JFBARBER_STORAGE_KV_REST_API_URL,
  token: process.env.JFBARBER_STORAGE_KV_REST_API_TOKEN,
});

const BOOKINGS_KEY = 'jfbarber_bookings';
const ADMIN_SECRET = 'javibarber7'; // Se puede pasar a process.env.ADMIN_PASSWORD en el futuro

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authHeader = req.headers.authorization;
  const isAdmin = authHeader === `Bearer ${ADMIN_SECRET}`;

  // Si envían un token pero es incorrecto
  if (authHeader && !isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let bookings = await redis.get(BOOKINGS_KEY);
    if (!bookings) bookings = [];

    if (req.method === 'GET') {
      if (req.query.verify === '1') {
         return res.status(isAdmin ? 200 : 401).json({ valid: isAdmin });
      }

      if (isAdmin) {
        return res.status(200).json(bookings);
      } else {
        // SANITIZACIÓN: Eliminar datos personales (RGPD) para el frontend público
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
      
      // Comprobar si ya existe una reserva para ese día y hora (que esté aceptada)
      const isTaken = bookings.some(b => 
          (b.fullDate === newBooking.fullDate || b.date === newBooking.date) && 
          b.time === newBooking.time && 
          b.status === 'accepted'
      );
      
      if (isTaken) {
          return res.status(409).json({ error: 'La hora ya ha sido ocupada por otra persona.' });
      }
      
      bookings.push(newBooking);
      await redis.set(BOOKINGS_KEY, bookings);
      
      return res.status(201).json(newBooking);
    }
    
    if (req.method === 'PUT') {
      if (!isAdmin) {
          return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id, status } = req.body;
      const index = bookings.findIndex(b => b.id === id);
      
      if (index !== -1) {
        bookings[index].status = status;
        await redis.set(BOOKINGS_KEY, bookings);
        return res.status(200).json(bookings[index]);
      }
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Redis error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
