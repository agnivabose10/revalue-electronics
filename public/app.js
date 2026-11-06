const $=s=>document.querySelector(s);
const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
let category='phone',mode='manual',reference='User-entered reference price',referenceURL=null;
let saved=null,models=[],photos=[],lookupSequence=0,lookupTimer,liveConfigured=false,lastQuery='',controller;
async function api(path,options){const r=await fetch(path,options);const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed.');return d;}
function notify(s){$('#toast').textContent=s;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',3500);}
function markStale(){if(saved){$('#result').dataset.stale='true';$('#result-label').textContent='Previous estimate · update to refresh';$('#save').disabled=true;}}
function syncDays(){const n=Number($('#days').value);$('#months').textContent=n<30?n+' days':Math.round(n/30.44)+' months';$('#age').value=Math.min(n,1825);}
$('#days').addEventListener('input',syncDays);
$('#age').addEventListener('input',()=>{$('#days').value=$('#age').value;syncDays();});
function fullModel(){const brand=$('#brand').value.trim(),model=$('#model').value.trim();return model.toLowerCase().startsWith(brand.toLowerCase())?model:[brand,model].filter(Boolean).join(' ');}
function sourceNote(text,url){$('#source').replaceChildren(document.createTextNode(text));if(url){try{if(new URL(url).protocol!=='https:')return;}catch{return;}const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' View listing ↗';$('#source').append(a);}}
function cancelSearch(){clearTimeout(lookupTimer);lookupSequence++;controller?.abort();$('#lookup').disabled=false;$('#lookup').textContent='Search prices ↗';}
function clearReference(){mode='manual';reference='User-entered reference price';referenceURL=null;$('#price').value='';$('#live-offers').hidden=true;$('#offer-list').replaceChildren();markStale();}
function setCategory(cat){
 category=cat;
 const laptop=['laptop','console'].includes(cat);
 $('#category-photo').src=laptop?'/assets/laptop.jpg':'/assets/phone.jpg';
 $('#category-photo').alt=laptop?'Decorative laptop photograph':'Decorative phone photograph';
 $('#category-caption').textContent=laptop?'A fresh start for good tech.':'There’s more life in your device.';
 document.querySelectorAll('[data-cat]').forEach(b=>{b.classList.toggle('selected',b.dataset.cat===cat);b.setAttribute('aria-pressed',b.dataset.cat===cat);});
 $('#battery-wrap').style.visibility=['phone','laptop','tablet'].includes(cat)?'visible':'hidden';
 $('#models').replaceChildren(...models.filter(m=>m.category===cat).map(m=>{const o=document.createElement('option');o.value=m.name+' '+m.variant;o.label='Example model — any model can be entered';return o;}));
}
document.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{
 cancelSearch();setCategory(b.dataset.cat);clearReference();lastQuery='';
 sourceNote('Category changed. Enter the exact model, then search its current price.');scheduleLookup();
}));
function scheduleLookup(){clearTimeout(lookupTimer);if(liveConfigured&&$('#model').value.trim().length>=4)lookupTimer=setTimeout(()=>lookupPrice(false),1400);}
for(const selector of ['#brand','#model'])$(selector).addEventListener('input',()=>{
 cancelSearch();clearReference();lastQuery='';sourceNote(liveConfigured?'Searching automatically when you finish typing…':'Enter any brand and model. Live pricing needs configuration; you can enter a verified price.');scheduleLookup();
});
$('#model').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(lookupTimer);lookupPrice(true);}});
$('#price').addEventListener('input',()=>{
 cancelSearch();mode='manual';reference='User-entered reference price';referenceURL=null;
 sourceNote('Using your reference price. Verify it matches the exact model and configuration.');markStale();
});
$('#estimate-form').addEventListener('input',markStale);
function applyOffer(offer){
 $('#price').value=offer.price;mode='live';reference=offer.source+' · '+(offer.title||fullModel())+' · retrieved '+new Date(offer.checkedAt).toLocaleString();referenceURL=offer.url;
 sourceNote(reference+' · Verify availability and final checkout price.',offer.url);markStale();
}
function renderOffers(offers){
 const list=$('#offer-list');list.replaceChildren();$('#live-offers').hidden=!offers.length;
 offers.forEach(offer=>{
  const row=document.createElement('div');row.className='offer';
  const title=document.createElement('strong');title.textContent=offer.title;
  const meta=document.createElement('span');meta.textContent=offer.source+' · '+money(offer.price);
  const actions=document.createElement('div');actions.className='offer-actions';
  const use=document.createElement('button');use.type='button';use.textContent='Use this price';
  use.onclick=()=>{applyOffer(offer);list.querySelectorAll('.offer').forEach(r=>r.classList.toggle('chosen-offer',r===row));};
  const link=document.createElement('a');link.href=offer.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View listing ↗';
  actions.append(use,link);row.append(title,meta,actions);list.append(row);
 });
}
async function lookupPrice(explicit=true){
 clearTimeout(lookupTimer);
 const q=fullModel(),cat=category;
 if(!$('#model').value.trim()){sourceNote('Enter the model and configuration first.');return;}
 if(q.length>150){sourceNote('Keep the full brand and model under 150 characters.');return;}
 if(!explicit&&lastQuery===q+'|'+cat)return;
 cancelSearch();const seq=++lookupSequence;controller=new AbortController();
 $('#lookup').disabled=true;$('#lookup').textContent='Searching…';sourceNote('Searching current Indian retail listings…');
 $('#live-offers').hidden=true;markStale();
 try{
  const d=await api('/api/price?q='+encodeURIComponent(q)+'&category='+encodeURIComponent(cat),{signal:controller.signal});
  if(seq!==lookupSequence||q!==fullModel()||cat!==category)return;
  lastQuery=q+'|'+cat;clearReference();renderOffers(d.offers||[]);
  if(d.mode==='manual'){
   sourceNote(d.source);return;
  }
  if(d.price!=null){applyOffer({price:d.price,source:d.source,title:d.selectedTitle||q,checkedAt:d.checkedAt,url:d.url});}
  else if(d.offers?.length){sourceNote(`Found ${d.offers.length} matching listings. Choose your exact storage, RAM and edition to fill the current price.`);}
  else{sourceNote('No matching new-device listing found. Try the full model and storage, or enter a verified retailer price. Discontinued devices may have no new stock.');}
 }catch(e){if(seq!==lookupSequence||e.name==='AbortError')return;clearReference();sourceNote(e.message);}
 finally{if(seq===lookupSequence){$('#lookup').disabled=false;$('#lookup').textContent='Search prices ↗';}}
}
$('#lookup').addEventListener('click',()=>lookupPrice(true));
async function run(){
 $('#error').textContent='';if(!$('#model').value.trim()){$('#error').textContent='Enter your exact model first.';return;}
 const btn=$('#submit');btn.disabled=true;$('#result').setAttribute('aria-busy','true');
 const snapshot=JSON.stringify([fullModel(),category,$('#price').value,$('#days').value,$('#battery').value,document.querySelector('[name=condition]:checked').value,$('#charger').checked,$('#box').checked]);
 try{
  const condition=document.querySelector('[name=condition]:checked').value;
  const input={price:Number($('#price').value),days:Number($('#days').value),category,condition,battery:Number($('#battery').value),charger:$('#charger').checked,box:$('#box').checked};
  const name=fullModel(),source=reference,sourceURL=referenceURL,sourceMode=mode;
  const r=await api('/api/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  const current=JSON.stringify([fullModel(),category,$('#price').value,$('#days').value,$('#battery').value,document.querySelector('[name=condition]:checked').value,$('#charger').checked,$('#box').checked]);
  if(snapshot!==current){markStale();return;}
  saved={model:name,...input,...r,reference:source,referenceURL:sourceURL,referenceMode:sourceMode,createdAt:new Date().toISOString(),photoAssessment:'Self-reported condition; photos checked for image quality only.'};
  $('#result-label').textContent='Your estimated resale value';$('#amount').textContent=money(r.value);
  $('#range').textContent=`Expected range ${money(r.low)} – ${money(r.high)}`;
  $('#condition-summary').textContent=`${condition[0].toUpperCase()+condition.slice(1)} condition · ${input.days} days used`;
  $('#b-price').textContent=money(input.price);$('#b-age').textContent='−'+money(r.ageLoss);$('#b-condition').textContent='−'+money(r.conditionLoss);
  $('#b-extras').textContent=r.batteryLoss+r.accessoryLoss?'−'+money(r.batteryLoss+r.accessoryLoss):money(0);
  $('#retained').textContent=r.retained+'% of its value';$('#bar').style.width=r.retained+'%';$('#listing').textContent=money(r.listing);
  $('#result-note').textContent=`Based on ${source}. Condition is self-reported. The ±10% range is a heuristic, not market confidence. Repairs and local demand may change the price.`;
  $('#result').dataset.stale='false';$('#save').disabled=false;
  if(innerWidth<650)$('#result').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){$('#error').textContent=e.message;}
 finally{btn.disabled=false;$('#result').setAttribute('aria-busy','false');}
}
$('#estimate-form').addEventListener('submit',e=>{e.preventDefault();run();});
$('#save').addEventListener('click',()=>{
 if(!saved||$('#save').disabled)return;
 const text=`PRITIPRIYA — RESALE ESTIMATE\n${saved.model}\nCreated: ${new Date(saved.createdAt).toLocaleString()}\n\nEstimated value: ${money(saved.value)}\nRange: ${money(saved.low)} – ${money(saved.high)}\nSuggested listing: ${money(saved.listing)}\n\nReference: ${money(saved.price)}\nSource: ${saved.reference}\nListing: ${saved.referenceURL||'Manually entered'}\nDays used: ${saved.days}\nCondition: ${saved.condition}\nBattery: ${saved.battery}%\nCharger: ${saved.charger?'Yes':'No'}; Box: ${saved.box?'Yes':'No'}\n\nAge reduction: ${money(saved.ageLoss)}\nCondition reduction: ${money(saved.conditionLoss)}\nBattery reduction: ${money(saved.batteryLoss)}\nAccessory reduction: ${money(saved.accessoryLoss)}\n\nFormula: reference × 0.90 × (1 − annual rate)^(days / 365) × condition factor, less battery/accessory deductions. Annual rate: ${saved.annualRate*100}%. Range is ±10%, not statistical confidence.\nPhotos were not uploaded. Condition was self-reported, not automatically detected. Not a guaranteed offer.`;
 const u=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=u;a.download='pritipriya-estimate.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);notify('Estimate saved.');
});
function renderPhotos(){const wrap=$('#previews');wrap.replaceChildren();photos.forEach((p,i)=>{const div=document.createElement('div');div.className='preview';const img=document.createElement('img');img.src=p.url;img.alt='Device photo '+(i+1);const btn=document.createElement('button');btn.type='button';btn.textContent='×';btn.setAttribute('aria-label','Remove photo '+(i+1));btn.onclick=()=>{URL.revokeObjectURL(p.url);photos.splice(i,1);renderPhotos();};const label=document.createElement('span');label.textContent=p.note;div.append(img,btn,label);wrap.append(div);});$('#photo-note').textContent=photos.length?'Review visible wear in your photos, then select the matching condition below. These checks do not detect scratches or damage.':'Photos help you review wear. Image quality checks don’t detect damage.';}
async function addPhotos(files){for(const file of files){if(photos.length>=4){notify('You can add up to 4 photos.');break;}if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){notify('Use JPG, PNG or WebP files under 8 MB.');continue;}const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=80;canvas.height=80;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,80,80);const data=ctx.getImageData(0,0,80,80).data;let lum=0;for(let i=0;i<data.length;i+=4)lum+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];lum/=6400;const note=Math.min(img.naturalWidth,img.naturalHeight)<500?'Low resolution — try a clearer photo':lum<55?'Too dark — use more light':lum>225?'Very bright — check for glare':'Lighting looks usable';photos.push({url,note});renderPhotos();}catch{URL.revokeObjectURL(url);notify('That image could not be read. Try another file.');}}$('#photos').value='';}
$('#photos').addEventListener('change',e=>addPhotos([...e.target.files]));const zone=$('#dropzone');zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag');});zone.addEventListener('dragleave',()=>zone.classList.remove('drag'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag');addPhotos([...e.dataTransfer.files]);});
try{
 const d=await api('/api/models');models=d.models;liveConfigured=d.liveConfigured;
 $('#brands').replaceChildren(...d.brands.map(brand=>{const o=document.createElement('option');o.value=brand;return o;}));
 setCategory('phone');
 sourceNote(liveConfigured?'Search any brand and model. Prices load automatically after typing; include the exact configuration.':'Search supports any brand and model. Live pricing is not configured yet; enter a verified retailer price.');
}catch{sourceNote('Search is unavailable. Enter any model and a verified retailer price.');}
