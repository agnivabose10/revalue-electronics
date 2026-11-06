export const catalog = [
 {id:'iphone15',name:'Apple iPhone 15',variant:'128 GB',category:'phone',price:59900},
 {id:'iphone14',name:'Apple iPhone 14',variant:'128 GB',category:'phone',price:49900},
 {id:'s24',name:'Samsung Galaxy S24',variant:'128 GB',category:'phone',price:64999},
 {id:'pixel8',name:'Google Pixel 8',variant:'128 GB',category:'phone',price:49999},
 {id:'macbook',name:'Apple MacBook Air M2',variant:'8 GB / 256 GB',category:'laptop',price:79900},
 {id:'ipad',name:'Apple iPad 10th generation',variant:'64 GB / Wi-Fi',category:'tablet',price:34900},
 {id:'ps5',name:'Sony PlayStation 5',variant:'Slim / Disc edition',category:'console',price:54990},
 {id:'sony',name:'Sony WH-1000XM5',variant:'Wireless headphones',category:'audio',price:24990}
];
export function estimate(x) {
 const price=Number(x.price),days=Number(x.days),battery=Number(x.battery ?? 100);
 if(!Number.isFinite(price)||price<100||price>10000000) throw Error('Enter a reference price between ₹100 and ₹1,00,00,000.');
 if(!Number.isInteger(days)||days<0||days>7300) throw Error('Days used must be a whole number between 0 and 7,300.');
 if(!Number.isFinite(battery)||battery<0||battery>100) throw Error('Battery health must be between 0 and 100.');
 const rates={phone:.25,laptop:.20,tablet:.22,console:.16,audio:.28};
 const factors={excellent:1,good:.88,fair:.70,poor:.45};
 if(!(x.category in rates)||!(x.condition in factors))throw Error('Choose a valid category and condition.');
 const ageFactor=.9*Math.pow(1-rates[x.category],days/365);
 const ageValue=price*ageFactor;
 const conditionValue=ageValue*factors[x.condition];
 const batteryLoss=['phone','laptop','tablet'].includes(x.category)?conditionValue*Math.max(0,85-battery)*.006:0;
 const extras=(x.charger?0:conditionValue*.03)+(x.box?0:conditionValue*.01);
 const value=Math.max(price*.03,conditionValue-batteryLoss-extras);
 const round=n=>Math.round(n/100)*100;
 return {value:round(value),low:round(value*.9),high:round(value*1.1),listing:round(value*1.08),ageLoss:Math.round(price-ageValue),conditionLoss:Math.round(ageValue-conditionValue),batteryLoss:Math.round(batteryLoss),accessoryLoss:Math.round(extras),annualRate:rates[x.category],retained:Math.round(value/price*100)};
}
