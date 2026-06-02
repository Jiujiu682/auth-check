const { webcrypto } = require('node:crypto');
const fs = require('fs');
const path = require('path');
const SEC = 'abc1234567890key';
const dbFile = path.join(__dirname, 'db.json');
const loadDB = ()=>JSON.parse(fs.readFileSync(dbFile,'utf8'));
const saveDB = d=>fs.writeFileSync(dbFile,JSON.stringify(d,null,2));

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
  let db = loadDB();
  const {keys}=await aesDec(req.body.payload);
  db.forEach(i=>{if(keys.includes(i.code))i.ban='正常'});
  saveDB(db);
  res.json({payload:await aesEnc({msg:'ok'})});
}
