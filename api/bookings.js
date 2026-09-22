const { Redis } = require('@upstash/redis');

// Initialize Redis using the variables injected by Vercel Upstash Integration
const redis = new Redis({
  url: process.env.JFBARBER_STORAGE_KV_REST_API_URL,
  token: process.env.JFBARBER_STORAGE_KV_REST_API_TOKEN,
});

const BOOKINGS_KEY = 'jfbarber_bookings';

module.exports = async (req, res) => {
  // Configurar CORS por si acaso
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      let bookings = await redis.get(BOOKINGS_KEY);
      if (!bookings) bookings = [];
      return res.status(200).json(bookings);
    } 
    
    if (req.method === 'POST') {
      const newBooking = req.body;
      let bookings = await redis.get(BOOKINGS_KEY);
      if (!bookings) bookings = [];
      
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
      const { id, status } = req.body;
      let bookings = await redis.get(BOOKINGS_KEY);
      if (!bookings) bookings = [];
      
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
