const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const KEY = "abc1234567890key";
const db = path.join(__dirname, "db.json");
const load = () => fs.existsSync(db) ? JSON.parse(fs.readFileSync(db, "utf8")) : [];
const save = d => fs.writeFileSync(db, JSON.stringify(d, null, 2));
const dec = s => JSON.parse(CryptoJS.AES.decrypt(s, KEY).toString(CryptoJS.enc.Utf8));
const enc = o => CryptoJS.AES.encrypt(JSON.stringify(o), KEY).toString();
const rand = () => {
  let s = "", c = "ABCDEFGabcdefg1234567890";
  for (let i = 32; i--; ) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

module.exports = (req, res) => {
  let arr = load();
  let d = dec(req.body.payload);
  let add = [];
  let t = new Date().toLocaleString();
  for (let i = d.num; i--; ) {
    add.push({ code: rand(), type: d.type, useTime: "未使用", ban: "正常", day: d.day, create: t })
  }
  arr.push(...add);
  save(arr);
  res.json({ payload: enc({ msg: `生成${d.num}张`, list: add }) });
}
