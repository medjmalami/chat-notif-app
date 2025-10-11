import { Hono } from "hono";
import { getNotifsController } from "../controllers/notifs.controller/getNotifs.controller";
import { authMiddleware } from "../utils/middleware";
const notifRoutes = new Hono();
notifRoutes.get("/notifs", authMiddleware, getNotifsController);
export default notifRoutes;
