const CryptoJS = require("crypto-js");
const KEY = "abc1234567890key";
global.cardList = global.cardList || [];
const decode = s => JSON.parse(CryptoJS.AES.decrypt(s, KEY).toString(CryptoJS.enc.Utf8));
const encode = d => CryptoJS.AES.encrypt(JSON.stringify(d), KEY).toString();
const genCode = () => {
  let res = "", chars = "ABCDEFGHIJKLMNOPQRSTabcdefghijklmnopq1234567890";
  for(let i=0;i<32;i++) res += chars[Math.floor(Math.random()*chars.length)];
  return res;
};
module.exports = (req,res)=>{
  let data = decode(req.body.payload);
  let add = [];
  let time = new Date().toLocaleString();
  for(let i=0;i<data.num;i++){
    add.push({code:genCode(),type:data.type,useTime:"未使用",ban:"正常",day:data.day,create:time})
  }
  global.cardList.push(...add);
  res.json({payload:encode({msg:`成功${data.num}张`,list:add})})
}
