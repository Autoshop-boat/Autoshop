const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-this-admin-key';
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB = path.join(DATA_DIR, 'store.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ orders: [] }, null, 2));

const products = [
  {id:1,name:'Premium Cotton T-Shirt',price:499,old:799,icon:'👕',shop:'Supplier A',cat:'Fashion'},
  {id:2,name:'Running Shoes',price:1199,old:1999,icon:'👟',shop:'Supplier B',cat:'Shoes'},
  {id:3,name:'Wireless Earbuds',price:899,old:1499,icon:'🎧',shop:'Supplier C',cat:'Electronics'},
  {id:4,name:'Smart Watch',price:1499,old:2499,icon:'⌚',shop:'Supplier A',cat:'Electronics'},
  {id:5,name:'Backpack',price:699,old:999,icon:'🎒',shop:'Supplier B',cat:'Fashion'},
  {id:6,name:'Home Lamp',price:549,old:899,icon:'💡',shop:'Supplier C',cat:'Home'}
];
const steps = ['Order Placed','Supplier Confirmed','Packed','Shipped','Out for Delivery','Delivered'];

function readDB(){ try { return JSON.parse(fs.readFileSync(DB,'utf8')); } catch { return {orders:[]}; } }
function writeDB(db){ fs.writeFileSync(DB, JSON.stringify(db,null,2)); }
function json(res,status,payload){ const body=JSON.stringify(payload); res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(body); }
function body(req){ return new Promise((resolve,reject)=>{ let d=''; req.on('data',c=>{d+=c;if(d.length>1e6) req.destroy();}); req.on('end',()=>{try{resolve(d?JSON.parse(d):{})}catch(e){reject(e)}}); req.on('error',reject); }); }
function token(){ return crypto.randomBytes(24).toString('hex'); }
function admin(req){ return req.headers['x-admin-key'] === ADMIN_KEY; }
function publicOrder(o){ const {customerToken,...safe}=o; return safe; }

async function api(req,res,url){
  if(req.method==='GET' && url.pathname==='/api/products') return json(res,200,products);
  if(req.method==='GET' && url.pathname==='/api/orders'){
    const t=req.headers['x-customer-token'];
    if(!t) return json(res,401,{error:'Customer session required'});
    const db=readDB(); return json(res,200,db.orders.filter(o=>o.customerToken===t).map(publicOrder));
  }
  if(req.method==='POST' && url.pathname==='/api/orders'){
    let b; try{b=await body(req)}catch{return json(res,400,{error:'Invalid JSON'});}
    const {name,phone,address,payment,items}=b;
    if(!name||!phone||!address||!Array.isArray(items)||!items.length) return json(res,400,{error:'Name, mobile, address and items are required'});
    if(!/^[0-9]{10}$/.test(String(phone))) return json(res,400,{error:'10 digit mobile number required'});
    if(payment!=='Cash on Delivery') return json(res,400,{error:'Only Cash on Delivery is enabled in this starter'});
    const cleanItems=items.map(x=>products.find(p=>p.id===Number(x.id))).filter(Boolean).map(p=>({id:p.id,name:p.name,price:p.price,icon:p.icon}));
    if(cleanItems.length!==items.length) return json(res,400,{error:'Invalid product in order'});
    const total=cleanItems.reduce((s,p)=>s+p.price,0);
    const db=readDB();
    const customerToken=token();
    const order={id:'AS'+Date.now().toString().slice(-6)+crypto.randomInt(10,99),name:String(name).trim(),phone:String(phone),address:String(address).trim(),payment:'Cash on Delivery',items:cleanItems,total,status:steps[0],supplier:'Pending Supplier Assignment',delivery:'Pending Delivery Partner',createdAt:new Date().toISOString(),customerToken};
    db.orders.unshift(order); writeDB(db);
    return json(res,201,{order:publicOrder(order),customerToken});
  }
  if(req.method==='GET' && url.pathname==='/api/admin/orders'){
    if(!admin(req)) return json(res,401,{error:'Admin authorization required'});
    return json(res,200,readDB().orders.map(publicOrder));
  }
  const m=url.pathname.match(/^\/api\/admin\/orders\/([^/]+)\/advance$/);
  if(req.method==='POST' && m){
    if(!admin(req)) return json(res,401,{error:'Admin authorization required'});
    const db=readDB(); const o=db.orders.find(x=>x.id===m[1]); if(!o)return json(res,404,{error:'Order not found'});
    const i=steps.indexOf(o.status); o.status=steps[Math.min(i+1,steps.length-1)];
    if(o.status==='Supplier Confirmed') o.supplier='Supplier A/B/C — demo assignment';
    if(o.status==='Shipped') o.delivery='3rd-party Delivery Partner — demo';
    if(o.status==='Out for Delivery') o.delivery='3rd-party Delivery Partner — demo';
    writeDB(db); return json(res,200,{order:publicOrder(o)});
  }
  return json(res,404,{error:'Not found'});
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(url.pathname.startsWith('/api/')) return api(req,res,url);
  let p=url.pathname==='/'?'/index.html':url.pathname;
  const file=path.normalize(path.join(PUBLIC,p));
  if(!file.startsWith(PUBLIC)) return res.writeHead(403).end();
  fs.readFile(file,(err,data)=>{ if(err)return res.writeHead(404).end('Not found'); const ext=path.extname(file); const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'}; res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'}); res.end(data); });
});
server.listen(PORT,()=>console.log(`AutoShop running on http://localhost:${PORT}`));
