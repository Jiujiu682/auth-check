const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const KEY = "abc1234567890key";
const db = path.join(__dirname, "db.json");
const load = () => fs.existsSync(db) ? JSON.parse(fs.readFileSync(db, "utf8")) : [];
const dec = s => JSON.parse(CryptoJS.AES.decrypt(s, KEY).toString(CryptoJS.enc.Utf8));
const enc = o => CryptoJS.AES.encrypt(JSON.stringify(o), KEY).toString();

module.exports = (req, res) => {
  let d = dec(req.body.payload);
  let list = load().filter(x => {
    let f = true;
    if (d.key && !x.code.includes(d.key)) f = false;
    if (d.use && x.useTime != d.use) f = false;
    if (d.ban && x.ban != d.ban) f = false;
    return f;
  })
  res.json({ payload: enc(list) });
}
