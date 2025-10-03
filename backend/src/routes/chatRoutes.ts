import { Hono } from "hono";
import { getChatsController } from "../controllers/chats.controller/getChats.controller";
import { addChatController } from "../controllers/chats.controller/addChat.controller";
import { authMiddleware } from "../utils/middleware";
const chatRoutes = new Hono();

chatRoutes.get("/chats", authMiddleware , getChatsController);
chatRoutes.post("/addchat", authMiddleware, addChatController);

export default chatRoutes;