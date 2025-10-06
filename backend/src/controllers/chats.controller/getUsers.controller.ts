import { Context } from "hono";
import { db } from "../../db";
import { users } from "../../db/schema";
export const getUsersController = async (c : Context) => {
    try {
        const Users = await db.select({id: users.id, name: users.username}).from(users);
        return c.json(Users);
        
    } catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
}