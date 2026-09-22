const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.JFBARBER_STORAGE_KV_REST_API_URL,
  token: process.env.JFBARBER_STORAGE_KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
    await redis.del('jfbarber_bookings');
    return res.status(200).json({ status: 'cleared' });
};
