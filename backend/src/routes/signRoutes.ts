import { Hono } from "hono";
import { signupController } from "../controllers/sign.controllers/signup.controller";
import { signinController } from "../controllers/sign.controllers/signin.controller";

export const signRoutes = new Hono();

signRoutes.post("/signup", signupController);
signRoutes.post("/signin", signinController);