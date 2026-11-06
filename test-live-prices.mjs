import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOffers,searchPrices,validateProviderQuote,configured} from './live-prices.mjs';
const fixture=(patch={})=>({title:'Samsung Galaxy S24 256GB',price:'₹54,999',extracted_price:54999,source:'Example retailer',product_link:'https://example.com/device',...patch});
test('retail results exclude used devices, accessories, wrong currency and unsafe links',()=>{
 const results=normalizeOffers([
  fixture(),fixture({title:'Samsung Galaxy S24 256GB Refurbished'}),
  fixture({condition:'used'}),fixture({price:'$599'}),fixture({product_link:'javascript:alert(1)'}),
  fixture({title:'Samsung Galaxy S24 256GB charger'}),fixture({title:'Samsung Galaxy S23 256GB'}),
  fixture({extensions:['Renewed']}),fixture({in_stock:false}),fixture({extracted_price:NaN})
 ],'Samsung Galaxy S24 256GB','phone');
 assert.equal(results.length,1);assert.equal(results[0].price,54999);assert.equal(results[0].autoEligible,true);
});
test('storage and editions require confirmation when ambiguous',()=>{
 assert.equal(normalizeOffers([fixture()],'Samsung Galaxy S24','phone')[0].autoEligible,false);
 assert.equal(normalizeOffers([fixture({title:'Samsung Galaxy S24 Ultra 256GB'})],'Samsung Galaxy S24 256GB','phone')[0].autoEligible,false);
 assert.equal(normalizeOffers([fixture({title:'Samsung Galaxy S24 128GB'})],'Samsung Galaxy S24 256GB','phone').length,0);
 assert.equal(normalizeOffers([fixture({title:'Samsung Galaxy S24 256 GB 8 GB'})],'Samsung Galaxy S24 256GB','phone')[0].autoEligible,false);
});
test('provider availability and stale quotes are explicit',async()=>{
 assert.equal(configured({}),false);assert.equal(await searchPrices('Fairphone 5','phone',{env:{}}),null);
 const quote={price:49000,currency:'INR',source:'Test retailer',checkedAt:new Date().toISOString()};
 assert.equal(validateProviderQuote(quote).price,49000);
 assert.throws(()=>validateProviderQuote({...quote,checkedAt:'2020-01-01'}));
 assert.throws(()=>validateProviderQuote({...quote,currency:'USD'}));
});
test('shopping lookup fills an exact variant, caches without exposing API credentials',async()=>{
 let calls=0;
 const options={env:{SERPAPI_API_KEY:'test-secret'},fetcher:async url=>{
  calls++;assert.equal(url.origin,'https://serpapi.com');assert.equal(url.searchParams.get('gl'),'in');assert.equal(url.searchParams.get('api_key'),'test-secret');
  return {ok:true,json:async()=>({shopping_results:[fixture()]})};
 }};
 const result=await searchPrices('Samsung Galaxy S24 256GB','phone',options);
 assert.equal(result.price,54999);assert.equal(result.needsSelection,false);assert.equal(result.mode,'live');
 assert.ok(!JSON.stringify(result).includes('test-secret'));
 const cached=await searchPrices('Samsung Galaxy S24 256GB','phone',options);assert.equal(calls,1);assert.equal(cached.cached,true);
});
test('multiple different matching listings never silently choose a variant',async()=>{
 const result=await searchPrices('Samsung Galaxy S24','phone',{env:{SERPAPI_API_KEY:'test-secret'},fetcher:async()=>({ok:true,json:async()=>({shopping_results:[fixture(),fixture({title:'Samsung Galaxy S24 128GB',extracted_price:49999})]})})});
 assert.equal(result.offers.length,2);assert.equal(result.price,null);assert.equal(result.needsSelection,true);
});
test('empty results and provider errors never generate a price',async()=>{
 const empty=await searchPrices('VeryRareLaptop 9000','laptop',{env:{SERPAPI_API_KEY:'test-secret'},fetcher:async()=>({ok:true,json:async()=>({shopping_results:[]})})});
 assert.equal(empty.price,null);assert.deepEqual(empty.offers,[]);
 await assert.rejects(searchPrices('Example Failed Model','phone',{env:{SERPAPI_API_KEY:'test-secret'},fetcher:async()=>({ok:false,status:429})}),/limit/);
 await assert.rejects(searchPrices('Example Invalid Key','phone',{env:{SERPAPI_API_KEY:'test-secret'},fetcher:async()=>({ok:true,json:async()=>({error:'Secret provider error test-secret'})})}),e=>!e.message.includes('test-secret'));
});
