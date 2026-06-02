import { createClient } from '@upstash/redis'
import crypto from 'crypto'

const redis = createClient({
  url: "https://peaceful-wildcat-141681.upstash.io",
  token: "gQAAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
})
const SECRET_SALT = "sk5689xd2026#1t"
const keyPool = [["ceshi123",1]]
const encryptKey = (str)=>crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*")
  try{
    if(req.method !== "POST") return res.json({ok:false})
    const {key}=req.body
    const md5Key = encryptKey(key)
    let blackList = await redis.get('usedBlackList')
    blackList = Array.isArray(blackList)?blackList:[]

    if(blackList.includes(md5Key)) return res.json({ok:false})
    const expire = await redis.get(`active:${md5Key}`)
    const now = new Date()
    if(expire){
      const end = new Date(expire)
      if(end <= now){
        blackList.push(md5Key)
        await redis.set('usedBlackList',blackList)
        await redis.del(`active:${md5Key}`)
        return res.json({ok:false})
      }
      return res.json({ok:true})
    }
    let day=0
    for(let [k,d] of keyPool){
      if(encryptKey(k)===md5Key) day=d
    }
    if(day===0) return res.json({ok:false})
    let endDate = new Date()
    endDate.setDate(endDate.getDate()+day)
    await redis.set(`active:${md5Key}`,endDate.toString())
    blackList.push(md5Key)
    await redis.set('usedBlackList',blackList)
    return res.json({ok:true})
  }catch(e){
    return res.json({ok:false})
  }
}
