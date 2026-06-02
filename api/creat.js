const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const SEC = 'abc1234567890key';
const dbFile = path.join(__dirname, 'db.json');

const loadDB = () => {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
};
const saveDB = arr => fs.writeFileSync(dbFile, JSON.stringify(arr, null, 2));

async function getKey() {
  return webcrypto.subtle.importKey('raw', Buffer.from(SEC), { name: 'AES-CBC' }, false, ['encrypt', 'decrypt'])
}
async function aesDec(str) {
  const k = await getKey();
  const buf = Buffer.from(str, 'base64');
  const iv = buf.slice(0, 16);
  const data = buf.slice(16);
  const dec = await webcrypto.subtle.decrypt({ name: 'AES-CBC', iv }, k, data);
  return JSON.parse(Buffer.from(dec).toString());
}
async function aesEnc(obj) {
  const k = await getKey();
  const iv = crypto.randomBytes(16);
  const raw = Buffer.from(JSON.stringify(obj));
  const enc = await webcrypto.subtle.encrypt({ name: 'AES-CBC', iv }, k, raw);
  return Buffer.concat([iv, Buffer.from(enc)]).toString('base64');
}

const makeCode = () => {
  const c = 'ABCDEFGHIJKLMNOPQRSTabcdefghijklmnopq1234567890';
  let s = '';
  for (let i = 0; i < 32; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
};

module.exports = async (req, res) => {
  let db = loadDB();
  const { num, type, day } = await aesDec(req.body.payload);
  const now = new Date().toLocaleString();
  const arr = [];
  for (let i = 0; i < num; i++) {
    arr.push({
      code: makeCode(),
      type: type,
      useTime: "未使用",
      expire: "未生效",
      ban: "正常",
      remark: "",
      day: day,
      left: 0,
      admin: "后台生成",
      create: now,
      last: ""
    })
  }
  db.push(...arr);
  saveDB(db);
  res.json({ payload: await aesEnc({ list: arr, msg: `生成${num}张卡密` }) });
}
