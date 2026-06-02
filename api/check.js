const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const KEY = "abc1234567890key";
const dbPath = path.join(__dirname, "db.json");

function loadDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, "[]");
    return [];
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

//解密
function decrypt(str) {
  let raw = CryptoJS.AES.decrypt(str, KEY);
  return JSON.parse(raw.toString(CryptoJS.enc.Utf8));
}
//加密
function encrypt(obj) {
  return CryptoJS.AES.encrypt(JSON.stringify(obj), KEY).toString();
}

module.exports = async (req, res) => {
  const db = loadDB();
  let body = decrypt(req.body.payload);
  let list = db.filter(item => {
    let ok = true;
    if (body.key && !item.code.includes(body.key)) ok = false;
    if (body.use && item.useTime !== body.use) ok = false;
    if (body.ban && item.ban !== body.ban) ok = false;
    return ok;
  })
  res.json({ payload: encrypt(list) });
}
