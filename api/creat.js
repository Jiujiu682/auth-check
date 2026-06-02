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
//生成32位卡密
function makeCode() {
  let s = "", ch = "ABCDEFGHIJKLMNOPQRSTabcdefghijklmnopq1234567890";
  for (let i = 0; i < 32; i++) s += ch[Math.floor(Math.random() * ch.length)];
  return s;
}

module.exports = async (req, res) => {
  let db = loadDB();
  let data = decrypt(req.body.payload);
  let { num, type, day } = data;
  let addArr = [];
  let now = new Date().toLocaleString();
  for (let i = 0; i < num; i++) {
    addArr.push({
      code: makeCode(),
      type: type,
      useTime: "未使用",
      ban: "正常",
      day: day,
      admin: "后台生成",
      create: now
    })
  }
  db.push(...addArr);
  saveDB(db);
  res.json({ payload: encrypt({ msg: `成功生成${num}张`, list: addArr }) });
}
