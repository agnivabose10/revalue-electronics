// Live Indian retail search. No API keys or provider URLs are returned to visitors.
export const brands = ['Apple','Samsung','Google','OnePlus','Xiaomi','Redmi','POCO','Realme','OPPO','Vivo','iQOO','Nothing','Motorola','Nokia','HMD','Honor','Huawei','Asus','Acer','Dell','HP','Lenovo','MSI','Microsoft','LG','Sony','Nintendo','Valve','Framework','Razer','Gigabyte','Infinix','Tecno','Lava','Itel','Fairphone','Bose','JBL','Sennheiser','Marshall','Beats','Anker','boAt','Noise','Jabra','Audio-Technica','Skullcandy','Logitech','Corsair','SteelSeries','Panasonic','Philips','Toshiba'];
const categories = new Set(['phone','laptop','tablet','console','audio']);
const cache = new Map(), pending = new Map();
const ttl = 60 * 60 * 1000;
let windowStart=0, searches=0;
export function configured(env=process.env) {return !!(env.SERPAPI_API_KEY || env.PRICE_API_URL);}
const normalize = value => String(value ?? '').toLowerCase().replace(/\+/g,' plus ').replace(/(\d)\s+(gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').trim();
const unsafeTitle = /\b(refurbished|renewed|pre[ -]?owned|used|second[ -]?hand|replacement|dummy|replica|screen protector|tempered glass|back cover|case for|compatible with|for parts|monthly|emi)\b/i;
function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
export function normalizeOffers(items,query,category,now=Date.now()){
 const q=normalize(query), tokens=q.split(' ').filter(Boolean);
 const qualifiers=['pro','max','plus','ultra','mini','lite','fe','se','air','slim','digital','disc'];
 const capacities=q.match(/\b\d+(?:gb|tb)\b/g)||[];
 const seen=new Set();
 return (Array.isArray(items)?items:[]).flatMap(item=>{
  if(!item||typeof item.title!=='string')return [];
  const title=item.title.slice(0,300), t=normalize(title), price=item.extracted_price;
  if(unsafeTitle.test(title)||unsafeTitle.test((Array.isArray(item.extensions)?item.extensions:[]).join(' '))||(['phone','tablet','laptop','console'].includes(category)&&/\b(charger|adapter|cable|cover|protector|sleeve|replacement|battery only|skin for)\b/i.test(title))||item.second_hand||item.used||item.refurbished||item.in_stock===false)return [];
  if(item.condition && !/^new$/i.test(item.condition))return [];
  // Google Shopping's India locale alone is not proof of currency.
  if(!/₹|\bINR\b|\bRs\.?\s/i.test(String(item.price))||!Number.isFinite(price)||price<100||price>10000000)return [];
  const url=safeURL(item.link)||safeURL(item.product_link);
  if(!url||!item.source)return [];
  const exact=tokens.every(token=>t.split(' ').includes(token));
  if(!exact)return [];
  const unexpectedVariant=qualifiers.some(word=>t.split(' ').includes(word)&&!q.split(' ').includes(word));
  const titleCapacities=t.match(/\b\d+(?:gb|tb)\b/g)||[];
  const capacityMatch=capacities.length>0 && titleCapacities.length===capacities.length && capacities.every(c=>titleCapacities.includes(c));
  // A unique, token-matched storage variant is needed for automatic filling.
  // Other matches remain available for explicit visitor confirmation.
  const autoEligible=!unexpectedVariant && (['phone','tablet','laptop'].includes(category)?capacityMatch:category==='audio');
  const key=title+'|'+item.source+'|'+price;if(seen.has(key))return [];seen.add(key);
  return [{title,price,currency:'INR',source:String(item.source).slice(0,100),url,checkedAt:new Date(now).toISOString(),autoEligible}];
 }).slice(0,12);
}
export function validateProviderQuote(d,now=Date.now()){
 if(!d||!Number.isFinite(d.price)||d.price<100||d.price>10000000||d.currency!=='INR'||typeof d.source!=='string'||!d.source||!Number.isFinite(Date.parse(d.checkedAt)))throw Error('The provider returned an invalid INR quote. Enter a verified price.');
 const age=now-Date.parse(d.checkedAt);if(age>7*86400000||age< -300000)throw Error('The provider quote is not recent. Enter a verified price.');
 return {price:d.price,currency:'INR',source:d.source.slice(0,200),checkedAt:d.checkedAt,url:safeURL(d.url),mode:'live',offers:[]};
}
export async function searchPrices(query,category,{env=process.env,fetcher=fetch,now=Date.now()}={}){
 if(!query?.trim()||query.length>150||!categories.has(category))throw Error('Enter a model up to 150 characters and choose a valid category.');
 if(!configured(env))return null;
 const key=normalize(query)+'|'+category+'|'+(env.SERPAPI_API_KEY?'shopping':env.PRICE_API_URL);
 const hit=cache.get(key);if(hit&&now-hit.created<ttl)return {...hit.data,cached:true};
 if(pending.has(key))return pending.get(key);
 if(now-windowStart>60000){windowStart=now;searches=0;}
 if(searches>=30)throw Error('Live lookup is busy. Please try again in a minute or enter a verified price.');
 searches++;
 const promise=(async()=>{
  let result;
  if(env.SERPAPI_API_KEY){
   const url=new URL('https://serpapi.com/search.json');
   for(const [k,v]of Object.entries({engine:'google_shopping',q:query+' '+({phone:'smartphone',laptop:'laptop',tablet:'tablet',console:'console',audio:'audio'}[category])+' new',gl:'in',hl:'en',google_domain:'google.co.in',api_key:env.SERPAPI_API_KEY}))url.searchParams.set(k,v);
   let response;try{response=await fetcher(url,{signal:AbortSignal.timeout(12000)});}catch{throw Error('Live search timed out. Try again or enter a verified price.');}
   if(!response.ok)throw Error(response.status===429?'The price provider search limit was reached. Try again later.':'The price provider is unavailable. Check its configuration or enter a verified price.');
   let data;try{data=await response.json();}catch{throw Error('The price provider returned an unreadable response.');}
   if(data.error)throw Error('The price provider rejected the search. Check API key and quota in Render.');
   const offers=normalizeOffers(data.shopping_results,query,category,now);
   // Differing matches need confirmation, even when each contains the query.
   const eligible=offers.filter(o=>o.autoEligible);
   const uniqueTitles=new Set(eligible.map(o=>normalize(o.title)));
   const selected=eligible.length&&uniqueTitles.size===1?[...eligible].sort((a,b)=>a.price-b.price)[0]:null;
   result={mode:'live',offers,price:selected?.price??null,currency:'INR',source:selected?.source??'Google Shopping via SerpAPI',checkedAt:new Date(now).toISOString(),url:selected?.url??null,selectedTitle:selected?.title??null,needsSelection:!selected,query};
  }else{
   const url=new URL(env.PRICE_API_URL);if(url.protocol!=='https:')throw Error('Price provider must use HTTPS.');url.searchParams.set('q',query);url.searchParams.set('category',category);url.searchParams.set('currency','INR');
   let response;try{response=await fetcher(url,{headers:env.PRICE_API_KEY?{Authorization:`Bearer ${env.PRICE_API_KEY}`}:{},signal:AbortSignal.timeout(12000)});}catch{throw Error('Live lookup failed. Try again or enter a verified price.');}
   if(!response.ok)throw Error('Price provider is temporarily unavailable. Enter a verified price.');
   result=validateProviderQuote(await response.json(),now);
  }
  if(cache.size>=256)cache.delete(cache.keys().next().value);
  cache.set(key,{created:now,data:result});return {...result,cached:false};
 })();pending.set(key,promise);
 try{return await promise;}finally{pending.delete(key);}
}
