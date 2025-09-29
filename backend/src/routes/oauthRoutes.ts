import { Hono } from "hono";
import { getUrl } from "../controllers/oath.controller/getUrl.controller";

const oauthRoutes = new Hono();

oauthRoutes.get("/url", getUrl);

export default oauthRoutes;
