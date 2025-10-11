import { getCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
export const authMiddleware = async (c, next) => {
    const accessToken = getCookie(c, 'accessToken');
    if (!accessToken) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            return c.json({ message: "Unauthorized" }, 401);
        }
        c.set('user', decoded);
        await next();
    }
    catch (error) {
        return c.json({ message: "Unauthorized" }, 401);
    }
};
