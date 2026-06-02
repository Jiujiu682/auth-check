const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const KEY_FILE = path.resolve('./active.json')
const keyPool = [
    ["gegggegggg333",1],
    ["hubeufuisfi1661",1],
    ["fgbgkrnsjng1919",1]
]

let activeKey = {}
const SECRET_SALT = "sk5689xd2026#1t"

if(fs.existsSync(KEY_FILE)){
    try{
        activeKey = JSON.parse(fs.readFileSync(KEY_FILE,'utf8'))
    }catch{
        activeKey = {}
    }
}

function saveActive(){
    fs.writeFileSync(KEY_FILE,JSON.stringify(activeKey))
}

function encryptKey(str){
    return crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')
}

export default async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin","*")
    if(req.method !== "POST") return res.json({ok:false})
    const {key}=req.body
    if(!key) return res.json({ok:false})

    let md5k = encryptKey(key)
    if(activeKey[md5k]){
        return res.json({ok:new Date(activeKey[md5k])>new Date()})
    }

    let useDay=0
    for(let item of keyPool){
        let raw = item[0]
        let day = item[1]
        if(raw === key && day>0){
            useDay = day
            item[1] = item[1]-1
            let expire = new Date()
            expire.setDate(expire.getDate()+useDay)
            activeKey[md5k] = expire.getTime()
            saveActive()
            break
        }
    }

    if(useDay===0) return res.json({ok:false})
    return res.json({ok:true})
}
