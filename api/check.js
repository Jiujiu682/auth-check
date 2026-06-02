const REST_URL = "https://peaceful-wildcat-141681.upstash.io"
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
const HEADER_AUTH = `Bearer ${REST_TOKEN}`
const SECRET_SALT = "sk5689xd2026#1t"
const keyPool = [["ceshi124", 1]]
import crypto from "crypto"
const encryptKey = s=>crypto.createHmac("md5",SECRET_SALT).update(s).digest("hex")
const runRedis = async cmd=>{
  const r=await fetch(`${REST_URL}/${cmd}`,{headers:{Authorization:HEADER_AUTH}})
  return r.json()
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*")
  const {key}=req.body
  const md=encryptKey(key)
  const blackData=await runRedis("get usedBlackList")
  const black=Array.isArray(blackData.result)?blackData.result:[]
  if(black.includes(md)) return res.json({ok:false})

  const exp=await runRedis(`get active:${md}`)
  const now=new Date()
  if(exp.result){
    const end=new Date(exp.result)
    if(end<=now){
      black.push(md)
      await runRedis(`set usedBlackList ${JSON.stringify(black)}`)
      await runRedis(`del active:${md}`)
      return res.json({ok:false})
    }
    return res.json({ok:true})
  }

  let day=0
  for(let [k,d] of keyPool){
    if(encryptKey(k)===md) day=d
  }
  if(!day) return res.json({ok:false})

  let end=new Date()
  end.setDate(end.getDate()+day)
  await runRedis(`set active:${md} "${end}"`)
  black.push(md)
  await runRedis(`set usedBlackList ${JSON.stringify(black)}`)
  return res.json({ok:true})
}
