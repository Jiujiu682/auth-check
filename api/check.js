const deviceList = [
   ["ABC123","9999-12-31"],
   ["TEST001","2026-08-01"]
 ]
 const keyList = [["XINGTU30",30],["XINGTU7",7]]
 export default async (req,res)=>{
   res.setHeader("Access-Control-Allow-Origin","*")
   if(req.method!=='POST') return res.json({ok:false})
   const {machineCode,activeKey}=req.body
   const now = new Date()
   let ok1 = false
   for(let [code,endDay] of deviceList){
     if(code===machineCode && now <= new Date(endDay)) ok1=true
   }
   let ok2 = false
   if(activeKey) ok2 = keyList.some(item=>item[0]===activeKey)
   res.json({ok:ok1||ok2})
 }
