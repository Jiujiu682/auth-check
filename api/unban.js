const { webcrypto } = require('node:crypto');
const SEC = 'abc1234567890key';
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
  const {keys}=await aesDec(req.body.payload);
  db.forEach(d=>{if(keys.includes(d.code))d.ban='正常'})
  res.json({payload:await aesEnc({msg:'ok'})})
}
