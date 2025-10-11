import { getCookie, deleteCookie } from "hono/cookie";
import { db } from "../../db";
import { userSessions } from "../../db/schema";
import { eq } from "drizzle-orm";
export const logoutController = async (c) => {
    try {
        const accessToken = getCookie(c, 'accessToken');
        const refreshToken = getCookie(c, 'refreshToken');
        if (accessToken) {
            deleteCookie(c, 'accessToken');
        }
        if (refreshToken) {
            deleteCookie(c, 'refreshToken');
            await db.delete(userSessions).where(eq(userSessions.refreshToken, refreshToken)).execute();
        }
        return c.json({ message: "Logged out successfully" }, 200);
    }
    catch (error) {
        deleteCookie(c, 'accessToken');
        deleteCookie(c, 'refreshToken');
        return c.json({ message: "Internal server error" }, 500);
    }
};
