import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {catalog,estimate} from './pricing.mjs';
import {brands,configured,searchPrices} from './live-prices.mjs';
const root=new URL('./public/',import.meta.url);
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>16384)throw Error('Request is too large.');}return JSON.parse(data);}
export const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/health'&&req.method==='GET')return json(res,200,{status:'ok'});
 if(url.pathname==='/api/models'&&req.method==='GET')return json(res,200,{models:catalog.map(({price,...m})=>m),brands,liveConfigured:configured(),market:'IN',currency:'INR'});
 if(url.pathname==='/api/price'&&req.method==='GET'){
 const q=url.searchParams.get('q')?.trim();if(!q||q.length>150)return json(res,400,{error:'Enter a model name (up to 150 characters).'});
 const category=url.searchParams.get('category')||'phone';
 const live=await searchPrices(q,category);if(live)return json(res,200,live);
 return json(res,200,{mode:'manual',price:null,offers:[],configured:false,source:'Live pricing is not configured. Enter a verified retailer price.',checkedAt:null});
 }
 if(url.pathname==='/api/estimate'&&req.method==='POST')return json(res,200,estimate(await body(req)));
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed.'});
 const names={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/assets/phone.jpg':'assets/phone.jpg','/assets/laptop.jpg':'assets/laptop.jpg'};
 if(!names[url.pathname])return json(res,404,{error:'Not found.'});
 const name=names[url.pathname];res.writeHead(200,{'Content-Type':name.endsWith('jpg')?'image/jpeg':name.endsWith('html')?'text/html; charset=utf-8':name.endsWith('css')?'text/css':'text/javascript','X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL(name,root)));
 }catch(e){json(res,400,{error:e.message||'Unable to process your request.'});}
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('pritipriya is running on http://localhost:3000'));
