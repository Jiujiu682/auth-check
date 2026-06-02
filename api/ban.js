const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const KEY = "abc1234567890key";
const db = path.join(__dirname, "db.json");
const load = () => fs.existsSync(db) ? JSON.parse(fs.readFileSync(db, "utf8")) : [];
const save = d => fs.writeFileSync(db, JSON.stringify(d, null, 2));
const dec = s => JSON.parse(CryptoJS.AES.decrypt(s, KEY).toString(CryptoJS.enc.Utf8));
const enc = o => CryptoJS.AES.encrypt(JSON.stringify(o), KEY).toString();

module.exports = (req, res) => {
  let arr = load();
  let d = dec(req.body.payload);
  arr.forEach(x => d.keys.includes(x.code) && (x.ban = "封禁"));
  save(arr);
  res.json({ payload: enc({ msg: "ok" }) });
}
