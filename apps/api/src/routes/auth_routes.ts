import {Router} from 'express'
import { me, login, signup } from '../controllers/auth_controllers.js';
import { auth_middleware } from '../middleware/auth_middleware.js';

export const authRouter = Router()

authRouter.post('/signup',signup);
authRouter.post('/login',login);
authRouter.get("/me", auth_middleware, me)