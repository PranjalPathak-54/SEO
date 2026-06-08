import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import Authrouter from './routes/userRoutes.js'
import rankRouter from './routes/rankRoutes.js'
import analysisRouter from './routes/analysisRoutes.js'
import {startRankTrackingCron} from './cron/rankTrackingcron.js'
connectDB()
const app=express()
const PORT=process.env.PORT||8000;
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.send('Server running')
})
app.use('/api/auth',Authrouter)
app.use('/api/rank',rankRouter);
app.use('/api/analysis',analysisRouter)
startRankTrackingCron()

app.listen(8000,()=>{
    console.log(`Server running on ${PORT}`)
})