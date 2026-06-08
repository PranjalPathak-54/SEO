import express from 'express'
import { register,login,getUser } from '../controllers/userController.js'
import auth from '../middleware/auth.js'

const Authrouter=express.Router();

Authrouter.post('/register',register)
Authrouter.post('/login',login)
Authrouter.get('/user',auth,getUser)

export default Authrouter;