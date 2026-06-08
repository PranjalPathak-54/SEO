import keywordTracking from "../models/keywordTracking.js";
import { keyWordTracking } from "../services/keywordTrackerservices.js";

export const addKeyword=async(req,res)=>{
   try{
      const {keyword,url}=req.body

      if(!keyword||!url) return res.status(400).json({success:false,message:"Keyword and URL are required"});

      let domain;
      try{
        const urlObj=new URL(url.startsWith("http")? url:`https://${url}`);
        domain=urlObj.hostname.replace("www.","")
      }
      catch(error){
        return res.status(400).json({success:false,message:"Invalid URL format"})
      }
      const existing=await keywordTracking.findOne({userId:req.userId,keyword:keyword.toLowerCase().trim(),domain})
      if(existing){
        return res.status(400).json({success:false,message:"Already Tracking this keyword for this domain."})
      }
      const tracking=await keywordTracking.create({
        userId:req.userId,
        keyword:keyword.toLowerCase().trim(),
        url:url.startsWith("http") ? url : `http://${url}`,
        domain,
        status:"checking"
      })
      res.status(201).json({success:true,message:"Keyword tracking started",tracking})
      keyWordTracking(tracking)
   }
   catch(error){
      console.error("Add keyword error",error.message)
      if(error.code===1100) return res.status(400).json({success:false,message:"Already tracking this keyword"})
      return res.status(500).json({success:false,message:'Server error'})
   }
}

export const getKeyword=async(req,res)=>{
    try{
      const tracking=await keywordTracking.findOne({_id:req.params.id,userId:req.userId})
      if(!tracking) return res.status(404).json({success:false,message:'Keyword Tracking not found'});
      res.json({success:true,tracking})
    }
    catch(error){
      console.error("Get Keywords error:",error.message)
      res.status(500).json({success:false,message:'Server Error'})
    }
}

export const getKeywords=async(req,res)=>{
    try{
      const tracking=await keywordTracking.find({userId:req.userId}).sort({createdAt:-1}).select("-rankHistory")
      res.json({success:true,tracking})
    }
    catch(error){
      console.error("Get Keywords error:",error.message)
      res.status(500).json({success:false,message:'Server Error'})
    }
}

export const refreshKeyword=async(req,res)=>{
    try{
      const tracking=await keywordTracking.findOne({_id:req.params.id,userId:req.userId})
      if(!tracking) return res.status(404).json({success:false,message:'Keyword Tracking not found'});
      tracking.status="checking"
      await tracking.save()
      res.json({success:true,message:'Rank check started'})
      keyWordTracking(tracking)
    }
    catch(error){
      console.error("Get Keywords error:",error.message)
      res.status(500).json({success:false,message:'Server Error'})
    }
}

export const deleteKeyword=async(req,res)=>{
    try{
      const tracking=await keywordTracking.findByIdAndDelete({_id:req.params.id,userId:req.userId})
      if(!tracking) return res.status(404).json({success:false,message:'Keyword Tracking not found'});
      res.json({success:true,message:'Keyword Tracking Deleted'})
    }
    catch(error){
      console.error("Get Keywords error:",error.message)
      res.status(500).json({success:false,message:'Server Error'})
    }
}

export const toggleTracking=async(req,res)=>{
    try{
      const tracking=await keywordTracking.findOne({_id:req.params.id,userId:req.userId})
      if(!tracking) return res.status(404).json({success:false,message:'Keyword Tracking not found'});
      tracking.active=!tracking.active
      await tracking.save()
      res.json({success:true,tracking})
    }
    catch(error){
      console.error("Get Keywords error:",error.message)
      res.status(500).json({success:false,message:'Server Error'})
    }
}