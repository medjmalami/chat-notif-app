import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import rateLimit from 'hono-rate-limit';
import { serve } from '@hono/node-server';
import { signRoutes } from './routes/signRoutes';
import chatRoutes from './routes/chatRoutes';
import oauthRoutes from './routes/oauthRoutes';
import { initSocket } from './sockets/index';
import notifRoutes from './routes/notifRoutes';
const app = new Hono();
// ✅ CORS Configuration
app.use('*', cors({
    origin: process.env.FRONTEND_URL,
    allowMethods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowHeaders: [
        'Content-Type',
        'Authorization',
        'Cookie',
        'Set-Cookie'
    ],
    credentials: true,
    maxAge: 3600,
}));
// ✅ HTTP Security Headers
app.use('*', secureHeaders());
// ✅ Logging
app.use('*', logger());
// ✅ Rate Limiting
app.use('*', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: 'Too many requests from this IP, please try again later.',
}));
// ✅ Root Route
app.get('/', (c) => c.text('API is running'));
// ✅ 404 Route
app.notFound((c) => {
    return c.json({ error: 'Route not found' }, 404);
});
// ✅ REST Routes
app.route('/', signRoutes);
app.route('/', chatRoutes);
app.route('/', oauthRoutes);
app.route('/', notifRoutes);
// ✅ Create HTTP server properly for both Hono and Socket.IO
const PORT = Number(process.env.PORT || 3001);
const server = serve({
    fetch: app.fetch,
    port: PORT,
});
// ✅ Initialize Socket.IO on the same server
initSocket(server);
console.log(`🚀 Server running on http://localhost:${PORT}`);
