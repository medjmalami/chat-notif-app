import { Context } from "hono";
import { db } from "../../db";
import { users } from "../../db/schema";
import { ne } from "drizzle-orm";

export const getUsersController = async (c : Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    
    const Users = await db
      .select({ id: users.id, name: users.username })
      .from(users)
      .where(ne(users.id, user.id));
    
    return c.json(Users);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
}