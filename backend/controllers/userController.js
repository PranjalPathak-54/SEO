import User from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'30d'})
}
export const register=async(req,res)=>{
    try{
        const {name,email,password}=req.body;
        if(!name||!email||!password){
            return res.status(400).json({success:false,message:"All Fields are required"})
        }
        const existingUser=await User.findOne({email})
        if(existingUser){
            return res.status(400).json({success:false,message:"User Already Exists"});
        }
        const hashedPassword=await bcrypt.hash(password,await bcrypt.genSalt(10))
        const user=await User.create({name,email,password:hashedPassword})
        const token=generateToken(user._id)
        res.status(201).json({success:true,user,token})
    }
    catch(error){
        console.log(error.message)
        res.status(500).json({success:false,message:"Server Error"})
    }
}

export const login=async(req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email||!password){
            return res.status(400).json({success:false,message:"All Fields are required"})
        }
        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({success:false,message:"Invalid Credentials"});
        }
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(400).json({success:false,message:"Invalid Credentials"});
        }
        const token=generateToken(user._id)
        res.status(201).json({success:true,user,token})
    }
    catch(error){
        console.log(error.message)
        res.status(500).json({success:false,message:"Server Error"})
    }
}

export const getUser=async(req,res)=>{
    try{
        const user=await User.findById(req.userId).select('-password')
        if(!user){
            return res.status(400).json({success:false,message:"User Not Found"});
        }
        res.json({success:true,user})
    }
    catch(error){
        console.log(error.message)
        res.status(500).json({success:false,message:"Server Error"})
    }
}