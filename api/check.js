const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const KEY_FILE = path.resolve('./active.json')
const POOL_FILE = path.resolve('./keypool.json')

//初始化卡密池持久化，不再只存在内存
let keyPool = [
    ["geggg333",1],
    ["hubeufuisfi1661",1],
    ["fgbgkrnsjng1919",1]
]
if(fs.existsSync(POOL_FILE)){
  try{
    keyPool = JSON.parse(fs.readFileSync(POOL_FILE,'utf8'))
  }catch{keyPool=[["gegggegggg333",1]]}
}
const savePool=()=>fs.writeFileSync(POOL_FILE,JSON.stringify(keyPool))

let activeKey = {}
const SECRET_SALT = "sk5689xd2026#1t"
if(fs.existsSync(KEY_FILE)){
    try{activeKey = JSON.parse(fs.readFileSync(KEY_FILE,'utf8'))}
    catch{activeKey = {}}
}
const saveActive=()=>fs.writeFileSync(KEY_FILE,JSON.stringify(activeKey))

function encryptKey(str){
    return crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')
}

export default async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin","*")
    if(req.method !== "POST") return res.json({ok:false})
    const {key}=req.body
    if(!key) return res.json({ok:false})

    const md5k = encryptKey(key)
    //已激活密钥校验有效期
    if(activeKey[md5k]){
        const expire = new Date(activeKey[md5k])
        return res.json({ok:expire>new Date()})
    }

    let useDay=0
    for(let item of keyPool){
        const [raw,day] = item
        if(raw === key && Number(day)>0){
            useDay = day
            item[1] = Number(day)-1
            savePool() //立刻保存卡密剩余天数到keypool.json
            const expire = new Date()
            expire.setDate(expire.getDate()+useDay)
            activeKey[md5k] = expire.getTime()
            saveActive() //立刻写入active.json，无延迟
            break
        }
    }
    if(useDay===0) return res.json({ok:false})
    return res.json({ok:true})
}
