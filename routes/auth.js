import express from 'express';
import { loginGetHandler, loginPostHandler, signupGetHandler, signupPostHandler } from '../controllers/auth.js';

const authRoute = express.Router();

authRoute.route('/login')
    .get(loginGetHandler)
    .post(loginPostHandler)

authRoute.route('/signup')
    .get(signupGetHandler)
    .post(signupPostHandler)

export default authRoute;