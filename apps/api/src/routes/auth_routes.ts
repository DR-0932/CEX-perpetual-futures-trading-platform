import {Router} from 'express'
import { me, login, signup } from '../controllers/auth_controllers.js';
import { authMiddleware } from '../middleware/auth_middleware.js';

export const authRouter = Router()

authRouter.post('/signup',signup);
authRouter.post('/login',login);
authRouter.get("/me", authMiddleware, me)