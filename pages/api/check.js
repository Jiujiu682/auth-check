const REST_URL = "https://peaceful-wildcat-141681.upstash.io"
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
const HEADER_AUTH = `Bearer ${REST_TOKEN}`
const SECRET_SALT = "sk5689xd2026#1t"
const keyPool = [["ceshi130", 1]]
import crypto from "crypto"

const encryptKey = str => crypto.createHmac("md5",SECRET_SALT).update(str).digest("hex")

async function runRedis(cmd){
  const res = await fetch(`${REST_URL}/${cmd}`,{headers:{Authorization:HEADER_AUTH}})
  return res.json()
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*")
  const {key} = req.body
  const mdKey = encryptKey(key)

  let blackData = await runRedis("get usedBlackList")
  let blackList = Array.isArray(blackData.result) ? blackData.result : []
  if(blackList.includes(mdKey)) return res.json({ok:false})

  let activeData = await runRedis(`get active:${mdKey}`)
  const now = new Date()
  if(activeData.result){
    let expire = new Date(activeData.result)
    if(expire <= now){
      blackList.push(mdKey)
      await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)
      await runRedis(`del active:${mdKey}`)
      return res.json({ok:false})
    }
    return res.json({ok:true})
  }

  let days = 0
  for(let [k,d] of keyPool){
    if(encryptKey(k) === mdKey) days = d
  }
  if(!days) return res.json({ok:false})

  let expireDay = new Date()
  expireDay.setDate(expireDay.getDate()+days)
  await runRedis(`set active:${mdKey} "${expireDay}"`)
  blackList.push(mdKey)
  await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)

  return res.json({ok:true})
}
