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
function saveDB(arr) {
  fs.writeFileSync(dbPath, JSON.stringify(arr, null, 2));
}
function decrypt(str) {
  let raw = CryptoJS.AES.decrypt(str, KEY);
  return JSON.parse(raw.toString(CryptoJS.enc.Utf8));
}
function encrypt(obj) {
  return CryptoJS.AES.encrypt(JSON.stringify(obj), KEY).toString();
}

module.exports = async (req, res) => {
  let db = loadDB();
  let data = decrypt(req.body.payload);
  db.forEach(v => { if (data.keys.includes(v.code)) v.ban = "封禁"; });
  saveDB(db);
  res.json({ payload: encrypt({ msg: "ok" }) });
}
