const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
env.forEach(line => {
    if (line.includes('=')) {
        const [k, v] = line.split('=');
        process.env[k] = v.replace(/"/g, '');
    }
});
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.JFBARBER_STORAGE_KV_REST_API_URL,
  token: process.env.JFBARBER_STORAGE_KV_REST_API_TOKEN,
});

async function main() {
    console.log(await redis.get('jfbarber_bookings'));
}
main();
