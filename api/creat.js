const { webcrypto } = require('node:crypto');
const SEC = 'abc1234567890key';

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

//随机生成32位卡密
function randCode(len=32){
  const s='ABCDEFGHIJKLMNOPQRSTabcdefghijklmnopq0123456789';
  let res=''
  for(let i=0;i<len;i++) res+=s[Math.floor(Math.random()*s.length)]
  return res
}

module.exports=async(req,res)=>{
  //入参：num生成数量，type卡类型，day有效天数
  const {num,type,day}=await aesDec(req.body.payload);
  const now=new Date().toLocaleString();
  const newList=[]
  for(let i=0;i<num;i++){
    newList.push({
      code:randCode(),
      type:type,
      useTime:"未使用",
      expire:"未生效",
      ban:"正常",
      remark:"",
      day:day,
      left:0,
      admin:"后台生成",
      create:now,
      last:""
    })
  }
  global.keyDB.push(...newList);
  res.json({payload:await aesEnc({list:newList,msg:`成功生成${num}张卡密`})})
}
