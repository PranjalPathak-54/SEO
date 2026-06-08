import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

export async function scrapeUrl(url){
    let browser;
    try{
       const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
       const session=await bb.sessions.create({browserSettings:{blockAds:true}});
       browser=await chromium.connectOverCDP(session.connectUrl)
       const context=await browser.newContext()
       const page=await context.newPage()
       page.setDefaultNavigationTimeout(30000);

       const startTime=Date.now();
       let response;
       try{
         response=await page.goto(url,{waitUntil:"domcontentloaded"})
       }
       catch(naverror){
        await browser.close().catch(()=>{})
        browser=null
        return {success:false,error:naverror.message}
       }
       const loadTime=Date.now() - startTime
       await page.waitForTimeout(2000)

       const scrappedData=await page.evaluate(()=>{
        const getMetadata=(name)=>{
         const el=document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
         return el ? el.getAttribute("content") || "":""
        }
        const title=document.title||""
        const description=getMetadata("description")
        const canonical=document.querySelector('link[rel="canonical"]')?.href || "";

        const robots=getMetadata("robots")
        const ogTitle=getMetadata("og:title")
        const ogDescription=getMetadata("og:description")
        const ogImage=getMetadata("og:image")
        const twitterCard=getMetadata("twitter:card")
        const viewport=getMetadata("viewport")
        const charsetMeta=document.querySelector('meta[charset]')
        const charset=charsetMeta ? charsetMeta.getAttribute("charset") || "":""
        const h1Elements=document.querySelectorAll("h1");
        const h1Texts=Array.from(h1Elements).map((el)=>el.textContent?.trim()||"")

        const headings={
            h1:document.querySelectorAll("h1").length,
            h2:document.querySelectorAll("h2").length,
            h3:document.querySelectorAll("h3").length,
            h4:document.querySelectorAll("h4").length,
            h5:document.querySelectorAll("h5").length,
            h6:document.querySelectorAll("h6").length,
            h1Texts,
        };
        const allLinks=Array.from(document.querySelectorAll("a[href]"));
        const currentHost=window.location.hostname;
        let internalLinks=0;
        let externalLinks=0;
        allLinks.forEach((link)=>{
            try{
                const href=link.href;
                if(href.startsWith("mailto:") || href.startsWith("tel:")) return;
                const linkUrl=new URL(href);
                if(linkUrl.hostname===currentHost) internalLinks++;
                else externalLinks++;
            }
            catch{

            }
        })
        const allImages=Array.from(document.querySelectorAll("img"))
        const missingAlt=allImages.filter((img)=>!img.alt || img.alt.trim()==="").length;
        const bodyText=document.body?.innerText||""
        const wordCount=bodyText.split(/\s+/).filter((w)=>w.length > 0).length;
        const pageSize=document.documentElement.outerHTML.length;

        return{
            metaData:{title,description,canonical,robots,ogTitle,ogDescription,ogImage,twitterCard,viewport,charset},headings,links:{internal:internalLinks,external:externalLinks,total:allLinks.length},images:{total:allImages.length,missingAlt,withAlt:allImages.length - missingAlt},wordCount,pageSize,bodyText:bodyText.substring(0,3000)
        }
       })
       const statusCode=response?.status()||0
       await page.close()
       await browser.close()
       return{
         success:true,
         data:{...scrappedData,loadTime,statusCode,url}
       }
    }
    catch(error){
        console.error("[SCRAPER] Playwright session failed",error.message)
        if(browser){
            try{
                await browser.close()
            }
            catch(err){
                console.error("[SCRAPER] Browser close failed",err.message)
            }
        }
        return {success:false,error:error.message}
    }
}
