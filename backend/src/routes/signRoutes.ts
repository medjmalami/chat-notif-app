import { Hono } from "hono";

export const signRoutes = new Hono();

signRoutes.post("/", (c) => {
  return c.json({ message: "Hello World" });
});