import { createClient } from '@upstash/redis'
const redis = createClient({
  url:"粘贴你的url",
  token:"粘贴你的token"
})

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*")
  if(req.method!=='POST') return res.json({ok:false})
  const {key}=req.body
  //固定测试卡密
  if(key==='ceshi123'){
    return res.json({ok:true})
  }else{
    return res.json({ok:false})
  }
}
