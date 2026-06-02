const CryptoJS = require("crypto-js");
const KEY = "abc1234567890key";
global.cardList = global.cardList || [];
const decode = s => JSON.parse(CryptoJS.AES.decrypt(s, KEY).toString(CryptoJS.enc.Utf8));
const encode = d => CryptoJS.AES.encrypt(JSON.stringify(d), KEY).toString();
module.exports = (req,res)=>{
  let p = decode(req.body.payload);
  let arr = global.cardList.filter(item=>{
    let flag = true;
    if(p.key&&!item.code.includes(p.key)) flag=false;
    if(p.use&&item.useTime!==p.use) flag=false;
    if(p.ban&&item.ban!==p.ban) flag=false;
    return flag;
  })
  res.json({payload:encode(arr)})
}
