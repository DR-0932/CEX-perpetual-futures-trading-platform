import {Router} from 'express'
import { me, signin, signup } from '../controllers/auth_controllers.js';
import { authMiddleware } from '../middleware/auth_middleware.js';

export const authRouter = Router()

authRouter.post('/signup',signup);
authRouter.post('/signin',signin);
authRouter.get("/me", authMiddleware, me)