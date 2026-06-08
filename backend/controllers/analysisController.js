import Analysis from '../models/Analysis.js'
import {analyzeSeoData} from '../services/geminiService.js'
import { scrapeUrl } from '../services/scraperServices.js';
export const analyzeUrl=async(req,res)=>{
    try{
        const {url}=req.body;
        if(!url){
            return res.status(400).json({success:false,message:'URL is required'})
        }
        let validUrl;
        try{
            validUrl=new URL(url.startsWith("http") ? url:`https://${url}`)
        }
        catch(error){
            return res.status(400).json({sucess:false,message:'Invalid URL format'})
        }
        const analysis=await Analysis.create({userId:req.userId,url:validUrl.href,status:"processing"})
        res.json({success:true,message:'Analysis started',analysisId:analysis._id})
        try{
            const scrapeResult=await scrapeUrl(validUrl.href)

            if(!scrapeResult.success){
                analysis.result="failed"
                await analysis.save()
                return;
            }

            const airesult=await analyzeSeoData(scrapeResult.data)

            if(!airesult.success){
              analysis.status='failed'
              await analysis.save()
              return;
            }

            analysis.overallScore=airesult.data.overallScore||0;
            analysis.categories=airesult.data.categories||{};
            analysis.metaData=scrapeResult.data.metaData||{};
            analysis.headings=scrapeResult.data.headings||{};
            analysis.links=scrapeResult.data.links||{};
            analysis.images=scrapeResult.data.images||{};
            analysis.keywords=airesult.data.keywords||[];
            analysis.issues=airesult.data.issues||[];
            analysis.loadTime=scrapeResult.data.loadTime||0;
            analysis.pageSize=scrapeResult.data.pageSize||0;
            analysis.wordCount=scrapeResult.data.wordCount||0;
            analysis.status="completed"

            await analysis.save()
        }
        catch(bgError){
            console.error("Background analysis error",bgError.message)
            try{
                analysis.status="failed";
                await analysis.save()
            }
            catch(saveError){
                console.error("Failed to save failed status",saveError.message)
            }
        }
    }
    catch(error){
        console.error("Analyze Url error",error.message)
        if(!res.headersSent){
            res.status(500).json({success:false,message:"Server error"})
        }
    }
}

export const getAnalysis=async(req,res)=>{
    try{
        const analysis=await Analysis.findOne({_id:req.params.id,userId:req.userId})
        if(!analysis) return res.status(404).json({success:false,message:"Analysis not found"})
        res.json({success:true,analysis})
    }
    catch(error){
        console.error('Get analysis error:',error.message)
        res.status(500).json({success:false,message:'Server error'})
    }
}

export const getAnalyses=async(req,res)=>{
    try{
        const page=parseInt(req.query.page)||1;
        const limit=parseInt(req.query.limit)||10;
        const skip=(page-1)*limit;

        const analyses=await Analysis.find({userId:req.userId}).sort({createdAt:-1}).skip(skip).limit(limit).select("-issues -keywords")
        const total=await Analysis.countDocuments({userId:req.userId})

        res.json({success:true,analyses,pagination:{page,limit,total,pages:Math.ceil(total/limit)}})
    }
    catch(error){
        console.error('Get analysis error:',error.message)
        res.status(500).json({success:false,message:'Server error'})
    }
}

export const deleteAnalysis=async(req,res)=>{
    try{
        await Analysis.findByIdAndDelete({_id:req.params.id,userId:req.userId})
        res.json({success:true,message:'Analysis Deleted'})
    }
    catch(error){
        console.error('Delete Analysis error',error.message)
        res.status(500).json({success:false,message:'Server error'})
    }
}