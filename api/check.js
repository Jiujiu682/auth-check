//引入加密模块
const crypto = require('crypto')
//存放已激活用户密文和到期时间
let activeKey = {}
//加密盐值，客户端和服务端统一
const SECRET_SALT = "sk5689xd2026#1t"
//卡密池：【原始明文卡密,可用天数】，以后入库只存密文
const keyPool = [
    ["jjjjj52",1],
    ["hubeuufuis11661",1],
    ["fgbgkrnsjng1919",1],
]
//明文转加密密文
function encryptKey(str){
    return crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')
}
//接口入口
export default async (req,res)=>{
    //跨域放行
    res.setHeader("Access-Control-Allow-Origin","*")
    //只接收POST请求
    if(req.method !== "POST") return res.json({ok:false})
    //获取前端传来的卡密（前端始终明文）
    const {key}=req.body
    //卡密为空直接返回失败
    if(!key) return res.json({ok:false})
    //前端传入明文→后端加密成密文
    const md5k = encryptKey(key)
    //先查是否已经激活过
    if(activeKey[md5k]){
        return res.json({ok:new Date(activeKey[md5k])>new Date()})
    }
    let useDay=0
    //循环卡密池：把池子里明文卡密加密后和前端密文比对
    for(let i=0;i<keyPool.length;i++){
        let raw=keyPool[i][0]
        let d=keyPool[i][1]
        //池子明文加密，和前端传的加密值匹配
        if(encryptKey(raw) === md5k){
            useDay=d
            break
        }
    }
    if(useDay===0) return res.json({ok:false})
    //激活后：key只存密文进activeKey，不再存原始明文
    const expire = new Date()
    expire.setDate(expire.getDate()+useDay)
    activeKey[md5k]=expire
    return res.json({ok:true})
}
