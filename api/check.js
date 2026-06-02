import { createClient } from '@upstash/redis'
const redis = createClient({
  url:"https://trusted-mayfly-113263.upstash.io",
  token:"gQAAAAAAAbpvAAIgcDExNDY2NDlkYWZlMTA0YzIxYWVkNjlhYmEzNzJmMmM3ZQ"
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
