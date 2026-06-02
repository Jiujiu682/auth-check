export default async function handler(req,res){
    res.setHeader("Access-Control-Allow-Origin","*")
    return res.json({ok:true,msg:"接口正常，问题在Redis连接"})
}
