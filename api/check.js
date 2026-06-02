//引入加密模块
const crypto = require('crypto')
//存放已激活用户密文和到期时间
let activeKey = {}
//加密盐值，客户端和服务端统一
const SECRET_SALT = "sk5689xd2026#1t"
//卡密池：[明文卡密,可用天数]
const keyPool = [
    ["gegggegggg333",1],
    ["hubeufuisfi1661",1],
    ["fgbgkrnsjng1919",1]
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
    //获取前端传来的卡密
    const {key}=req.body
    //卡密为空直接返回失败
    if(!key) return res.json({ok:false})
    //明文加密
    const md5k = encryptKey(key)
    //已激活过，校验有效期
    if(activeKey[md5k]){
        return res.json({ok:new Date(activeKey[md5k])>new Date()})
    }
    let useDay=0
    //遍历卡密池匹配
    for(let i=0;i<keyPool.length;i++){
        let raw=keyPool[i][0]
        let d=keyPool[i][1]
        //卡密一致且剩余天数大于0
        if(raw===key&&d>0){
            useDay=d
            //该卡密次数-1
            keyPool[i][1]-=1
            //计算到期时间
            let exp=new Date()
            exp.setDate(exp.getDate()+useDay)
            //保存加密密钥+到期时间戳
            activeKey[md5k]=exp.getTime()
            break
        }
    }
    //大于0激活成功
    return res.json({ok:useDay>0})
}
