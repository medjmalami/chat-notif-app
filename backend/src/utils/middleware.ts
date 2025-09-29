import { Context , Next} from "hono";
import { getCookie } from "hono/cookie";
import jwt from "jsonwebtoken";

export const authMiddleware = async (c : Context, next : Next) => {
    const accessToken = getCookie(c, 'accessToken');
    if (!accessToken) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as jwt.JwtPayload;
        if (!decoded) {
            return c.json({ message: "Unauthorized" }, 401);
        }
        
        c.set('user', decoded);
        await next();
    } catch (error) {
        return c.json({ message: "Unauthorized" }, 401); 
    }
};