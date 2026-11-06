import {test} from 'node:test';import assert from 'node:assert/strict';import {estimate} from './pricing.mjs';import {server} from './server.mjs';import {Readable} from 'node:stream';
const input={price:59900,days:365,category:'phone',condition:'good',battery:90,charger:true,box:true};
test('transparent worked estimate',()=>{const r=estimate(input);assert.equal(r.value,35600);assert.equal(r.ageLoss,19468);assert.equal(r.conditionLoss,4852);assert.equal(r.listing,38400);});
test('age, damage and missing accessories reduce value',()=>{const a=estimate(input);assert.ok(estimate({...input,days:730}).value<a.value);assert.ok(estimate({...input,condition:'fair'}).value<a.value);assert.ok(estimate({...input,battery:70,charger:false,box:false}).value<a.value);assert.ok(a.low<a.value&&a.high>a.value);});
test('invalid inputs rejected',()=>{for(const patch of [{days:-1},{days:1.5},{price:0},{battery:101},{condition:'fake'},{category:'fake'}])assert.throws(()=>estimate({...input,...patch}));});
function request(url,method='GET',data){return new Promise(resolve=>{const req=Readable.from(data?[JSON.stringify(data)]:[]);req.url=url;req.method=method;const res={writeHead(status,headers){this.status=status;},end(data){resolve({status:this.status,data:JSON.parse(data)});}};server.emit('request',req,res);});}
test('API exposes sample provenance and validates estimates',async()=>{const p=await request('/api/price?q=Apple%20iPhone%2015');assert.equal(p.data.mode,'sample');assert.equal(p.data.checkedAt,null);const unknown=await request('/api/price?q=unknown');assert.equal(unknown.data.mode,'manual');const bad=await request('/api/estimate','POST',{...input,days:-1});assert.equal(bad.status,400);const good=await request('/api/estimate','POST',input);assert.equal(good.data.value,35600);});

test('Render health endpoint and bundled design assets',async()=>{
 const health=await request('/health');assert.equal(health.status,200);assert.equal(health.data.status,'ok');
 async function asset(url){return new Promise(resolve=>{const req=Readable.from([]);req.url=url;req.method='GET';const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(data){resolve({status:this.status,headers:this.headers,body:data});}};server.emit('request',req,res);});}
 const home=await asset('/');assert.equal(home.status,200);assert.match(home.body.toString(),/pritipriya/);assert.match(home.body.toString(),/device-collage/);
 for(const path of ['/assets/phone.jpg','/assets/laptop.jpg']){const image=await asset(path);assert.equal(image.status,200);assert.equal(image.headers['Content-Type'],'image/jpeg');assert.ok(image.body.length>10000);assert.equal(image.body[0],255);assert.equal(image.body[1],216);}
 const missing=await request('/assets/unknown.jpg');assert.equal(missing.status,404);
 const traversal=await request('/..%2fserver.mjs');assert.equal(traversal.status,404);
});
