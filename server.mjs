import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {catalog,estimate} from './pricing.mjs';
const root=new URL('./public/',import.meta.url);
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>16384)throw Error('Request is too large.');}return JSON.parse(data);}
// Optional provider contract: GET PRICE_API_URL?q=<model>&currency=INR
// Returns {price:number,currency:'INR',source:string,checkedAt:ISODate,url?:string}.
// Configure a trusted server endpoint. Credentials never reach the browser.
async function lookup(q){
 if(!process.env.PRICE_API_URL)return null;
 const url=new URL(process.env.PRICE_API_URL);if(url.protocol!=='https:')throw Error('Price provider must use HTTPS.');url.searchParams.set('q',q);url.searchParams.set('currency','INR');
 const r=await fetch(url,{headers:process.env.PRICE_API_KEY?{'Authorization':`Bearer ${process.env.PRICE_API_KEY}`}:{},signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('Price provider is temporarily unavailable. Enter a verified price below.');
 const d=await r.json();
 if(!Number.isFinite(d.price)||d.price<100||d.price>10000000||d.currency!=='INR'||!d.source||!d.checkedAt||!Number.isFinite(Date.parse(d.checkedAt)))throw Error('The provider did not return a valid INR price with a date and source.');
 if(Date.now()-Date.parse(d.checkedAt)>7*86400000||Date.parse(d.checkedAt)>Date.now()+300000)throw Error('The provider price is not recent. Enter a verified price below.');
 return {price:d.price,currency:'INR',source:String(d.source),checkedAt:d.checkedAt};
}
export const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/health'&&req.method==='GET')return json(res,200,{status:'ok'});
 if(url.pathname==='/api/models'&&req.method==='GET')return json(res,200,{models:catalog,liveConfigured:!!process.env.PRICE_API_URL});
 if(url.pathname==='/api/price'&&req.method==='GET'){
 const q=url.searchParams.get('q')?.trim();if(!q||q.length>150)return json(res,400,{error:'Enter a model name (up to 150 characters).'});
 const live=await lookup(q);if(live)return json(res,200,{...live,mode:'live'});
 const model=catalog.find(m=>m.name.toLowerCase()===q.toLowerCase());
 return json(res,200,{mode:model?'sample':'manual',price:model?.price??null,source:model?'Illustrative catalog price — verify before use':'Enter a current retailer price',checkedAt:null});
 }
 if(url.pathname==='/api/estimate'&&req.method==='POST')return json(res,200,estimate(await body(req)));
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed.'});
 const names={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/assets/phone.jpg':'assets/phone.jpg','/assets/laptop.jpg':'assets/laptop.jpg'};
 if(!names[url.pathname])return json(res,404,{error:'Not found.'});
 const name=names[url.pathname];res.writeHead(200,{'Content-Type':name.endsWith('jpg')?'image/jpeg':name.endsWith('html')?'text/html; charset=utf-8':name.endsWith('css')?'text/css':'text/javascript','X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL(name,root)));
 }catch(e){json(res,400,{error:e.message||'Unable to process your request.'});}
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('pritipriya is running on http://localhost:3000'));
