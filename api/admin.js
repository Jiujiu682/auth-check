const crypto = require('crypto')
const SECRET_SALT = "sk5689xd2026#1t"
global.activeKey = global.activeKey || {}
global.keyPool = global.keyPool || [
    ["jjjjj520",1],
    ["hubeuufuis11661",1],
    ["fgbgkrnsjng1919",1],
]
global.banList = global.banList || []

function encryptKey(str){
    return crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')
}

export default async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin","*")
    //POST：生成/续期/封禁
    if(req.method==="POST"){
        const {type,key,day,newDay}=req.body
        if(type==='create'){
            const ranKey = Math.random().toString(36).slice(2)+Date.now().toString(36)
            global.keyPool.push([ranKey,Number(day)])
            return res.json({code:ranKey})
        }
        if(type==='addTime'){
            const h=encryptKey(key)
            if(global.activeKey[h]){
                let t=new Date(global.activeKey[h])
                t.setDate(t.getDate()+Number(newDay))
                global.activeKey[h]=t
            }
            return res.json({ok:true})
        }
        if(type==='ban'){
            const h=encryptKey(key)
            if(!global.banList.includes(h)) global.banList.push(h)
            return res.json({ok:true})
        }
    }
    //GET：返回全部列表数据
    if(req.method==="GET"){
        const activeArr=[]
        for(let hash in global.activeKey){
            activeArr.push({hash,end:global.activeKey[hash],isBan:global.banList.includes(hash)})
        }
        return res.json({pool:global.keyPool,active:activeArr})
    }
}
