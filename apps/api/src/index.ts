import express from "express"
import jwt from 'jsonwebtoken'
import bcrypt   from 'bcrypt'


const app = express();
app.use(express.json());


