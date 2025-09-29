import { Hono } from "hono";
import { getChatsController } from "../controllers/chats.controller/getChats.controller";

const chatRoutes = new Hono();

chatRoutes.get("/chats", getChatsController);

export default chatRoutes;