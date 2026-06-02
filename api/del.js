const CryptoJS = require("crypto-js");
const KEY = "abc1234567890key";
global.cardList = global.cardList || [];
const decode = s => JSON.parse(CryptoJS.AES.decrypt(s, KEY).toString(CryptoJS.enc.Utf8));
const encode = d => CryptoJS.AES.encrypt(JSON.stringify(d), KEY).toString();
module.exports = (req,res)=>{
  let {keys}=decode(req.body.payload);
  global.cardList = global.cardList.filter(x=>!keys.includes(x.code));
  res.json({payload:encode({msg:"ok"})})
}
