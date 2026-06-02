import { createClient } from '@upstash/redis'
import crypto from 'crypto'

const redis = createClient({
  url:"填你的URL",
  token:"填你的TOKEN"
})

const SECRET_SALT = "sk5689xd2026#1t"
//这里填所有可用卡密 [卡密,天数]
const keyPool = [
    ["5201314a",1],
    ["hubei2025",1],
    ["fgbgkrnsjng1919",1],
]

const encryptKey = (str)=>crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')

export default async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin","*")
    if(req.method !== "POST") return res.json({ok:false})
    const {key} = req.body
    if(!key) return res.json({ok:false,msg:"卡密不能为空"})
    const md5Key = encryptKey(key)

    // 修复读取黑名单
    let blackList = await redis.get('usedBlackList')
    blackList = Array.isArray(blackList) ? blackList : []

    if(blackList.includes(md5Key)){
        return res.json({ok:false,msg:"该卡密已作废，无法再次激活"})
    }
    const expireTime = await redis.get(`active:${md5Key}`)
    const now = new Date()
    if(expireTime){
        const endDate = new Date(expireTime)
        if(endDate <= now){
            blackList.push(md5Key)
            await redis.set('usedBlackList',blackList)
            await redis.del(`active:${md5Key}`)
            return res.json({ok:false,msg:"卡密已过期作废"})
        }
        const leftDay = Math.ceil((endDate - now)/(1000*3600*24))
        return res.json({ok:true,leftDay,expire:endDate.toLocaleString()})
    }

    let validDay = 0
    for(let [rawKey,day] of keyPool){
        if(encryptKey(rawKey) === md5Key){
            validDay = day;break
        }
    }
    if(validDay === 0) return res.json({ok:false,msg:"无效卡密"})

    const finalExpire = new Date()
    finalExpire.setDate(finalExpire.getDate()+validDay)
    await redis.set(`active:${md5Key}`,finalExpire.toString())
    blackList.push(md5Key)
    await redis.set('usedBlackList',blackList)

    return res.json({ok:true,leftDay:validDay,expire:finalExpire.toLocaleString(),msg:"激活成功"})
}
