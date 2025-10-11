import { Hono } from "hono";
import { getUrl } from "../controllers/oath.controller/getUrl.controller";
import { createUserController } from "../controllers/oath.controller/createUser.controller";
const oauthRoutes = new Hono();
oauthRoutes.get("/url", getUrl);
oauthRoutes.post("/auth/callback", createUserController);
export default oauthRoutes;
