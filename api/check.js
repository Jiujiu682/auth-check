const REST_URL = "https://peaceful-wildcat-141681.upstash.io"
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
const HEADER_AUTH = `Bearer ${REST_TOKEN}`
const SECRET_SALT = "sk5689xd2026#1t"
const keyPool = [["ceshi126", 1]]
import crypto from "crypto"
const encryptKey = s=>crypto.createHmac("md5",SECRET_SALT).update(s).digest("hex")

async function runRedis(cmd){
  const res = await fetch(`${REST_URL}/${cmd}`,{headers:{Authorization:HEADER_AUTH}})
  return await res.json()
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*")
  try{
    const {key} = req.body
    const md = encryptKey(key)
    let blackRes = await runRedis("get usedBlackList")
    let black = Array.isArray(blackRes.result) ? blackRes.result : []
    if(black.includes(md)) return res.json({ok:false})

    let activeRes = await runRedis(`get active:${md}`)
    const now = new Date()
    if(activeRes.result){
      const end = new Date(activeRes.result)
      if(end <= now){
        black.push(md)
        await runRedis(`set usedBlackList ${JSON.stringify(black)}`)
        await runRedis(`del active:${md}`)
        return res.json({ok:false})
      }
      return res.json({ok:true})
    }

    let day = 0
    for(let [pwd,d] of keyPool){
      if(encryptKey(pwd) === md) day = d
    }
    if(!day) return res.json({ok:false})

    let endDate = new Date()
    endDate.setDate(endDate.getDate()+day)
    await runRedis(`set active:${md} "${endDate}"`)
    black.push(md)
    await runRedis(`set usedBlackList ${JSON.stringify(black)}`)
    return res.json({ok:true})
  }catch(err){
    // Redis出错直接返回失败，软件激活弹窗报错
    return res.json({ok:false})
  }
}
