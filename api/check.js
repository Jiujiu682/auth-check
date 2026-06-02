const { webcrypto } = require('node:crypto');
const SEC = 'abc1234567890key';
//全局统一数据
global.keyDB = global.keyDB || [
  {code:"TK0Tp412K0ZopTe5S6pyk3hc4QwNrP",type:"天卡",useTime:"未使用",expire:"未生效",ban:"正常",remark:"",day:1,left:0,admin:"",create:"2026-05-14 19:58:43",last:""},
  {code:"TK1L2CL0KWffy30J0vEpRDCYwQbSh",type:"天卡",useTime:"2026-05-28 20:45:25",expire:"2028-05-30 20:45:25",ban:"正常",remark:"",day:1,left:0,admin:"",create:"2026-05-14 19:59:43",last:"1.1.4.0"}
];
const db = global.keyDB;

async function getKey(){
  return webcrypto.subtle.importKey('raw',Buffer.from(SEC),{name:'AES-CBC'},false,['encrypt','decrypt'])
}
async function aesDec(str){
  const k=await getKey();
  const b=Buffer.from(str,'base64');
  const iv=b.slice(0,16);
  const data=b.slice(16);
  const raw=await webcrypto.subtle.decrypt({name:'AES-CBC',iv},k,data);
  return JSON.parse(Buffer.from(raw).toString());
}
async function aesEnc(obj){
  const k=await getKey();
  const iv=webcrypto.getRandomValues(new Uint8Array(16));
  const buf=Buffer.from(JSON.stringify(obj));
  const raw=await webcrypto.subtle.encrypt({name:'AES-CBC',iv},k,buf);
  return Buffer.concat([iv,Buffer.from(raw)]).toString('base64');
}

module.exports=async(req,res)=>{
  const payload=req.body.payload;
  const param=await aesDec(payload);
  let list=db.filter(item=>{
    let ok=true;
    if(param.key&&!item.code.includes(param.key))ok=false;
    if(param.use&&param.use!=='全部'){
      if(param.use==='已使用'&&item.useTime==='未使用')ok=false;
      if(param.use==='未使用'&&item.useTime!=='未使用')ok=false;
    }
    if(param.ban&&param.ban!=='全部'&&item.ban!==param.ban)ok=false;
    return ok;
  })
  res.json({payload:await aesEnc(list)})
}
