const crypto = require('crypto')

//发卡密：["卡密","天数"]
const keyPool = [
  ["GGGGGGGGGG111",1],
  ["mi222",90],
  ["mi333",365]
]
//已激活（这里自动存加密密文，不用手动改）
let activeKey = {}
//改成你专属乱码，越长越安全
const SECRET_SALT = "sk5689&xd2026#lt15191trhesfieasf9494"

function encryptKey(str){
  return crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')
}

export default async (req,res)=>{
  res.setHeader("Access-Control-Allow-Origin","*")
  if(req.method !== "POST") return res.json({ok:false})
  const {key}=req.body
  if(!key) return res.json({ok:false})

  let md5k = encryptKey(key)
  //已激活校验时间
  if(activeKey[md5k]){
    return res.json({ok:new Date(activeKey[md5k])>new Date()})
  }

  //查找有效卡密
  let useDay=0
  for(let [k,d] of keyPool){
    if(k===key) useDay=d
  }
  if(useDay===0) return res.json({ok:false})

  //激活入库
  let end = new Date(Date.now()+useDay*86400000)
  activeKey[md5k]=end.toLocaleDateString()
  res.json({ok:true})
}
