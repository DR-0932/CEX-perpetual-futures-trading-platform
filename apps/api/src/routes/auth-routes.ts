import {Router} from 'express'
import { signin, signup } from '../controllers/auth_controllers.js';

export const authRouter = Router()

authRouter.post('/signup',signup);
authRouter.post('/signin',signin);
