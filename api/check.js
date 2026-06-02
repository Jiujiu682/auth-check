const { webcrypto } = require('node:crypto');
const fs = require('fs');
const path = require('path');
const SEC = 'abc1234567890key';
const dbFile = path.join(__dirname, 'db.json');

//读写数据库
const loadDB = () => {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    const init = [
      {code:"TK0Tp412K0ZopTe5S6pyk3hc4QwNrP",type:"天卡",useTime:"未使用",expire:"未生效",ban:"正常",remark:"",day:1,left:0,admin:"",create:"2026-05-14 19:58:43",last:""},
      {code:"TK1L2CL0KWffy30J0vEpRDCYwQbSh",type:"天卡",useTime:"2026-05-28 20:45:25",expire:"2028-05-30 20:45:25",ban:"正常",remark:"",day:1,left:0,admin:"",create:"2026-05-14 19:59:43",last:"1.1.4.0"}
    ];
    fs.writeFileSync(dbFile, JSON.stringify(init, null, 2));
    return init;
  }
};
const saveDB = d => fs.writeFileSync(dbFile, JSON.stringify(d, null, 2));

//AES工具
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
  const db = loadDB();
  const param = await aesDec(req.body.payload);
  let list = db.filter(item=>{
    let ok=true;
    if(param.key&&!item.code.includes(param.key)) ok=false;
    if(param.use&&param.use!=='全部'){
      if(param.use==='已使用'&&item.useTime==='未使用') ok=false;
      if(param.use==='未使用'&&item.useTime!=='未使用') ok=false;
    }
    if(param.ban&&param.ban!=='全部'&&item.ban!==param.ban) ok=false;
    return ok;
  })
  res.json({payload:await aesEnc(list)});
}
