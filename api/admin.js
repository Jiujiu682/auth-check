const crypto = require('crypto')
const SECRET_SALT = "sk5689xd2026#1t"
global.activeKey = global.activeKey || {}
global.keyPool = global.keyPool || [
    ["jjjjj520",1],
    ["hubeuufuis11661",1],
    ["fgbgkrnsjng1919",1],
]
global.banList = global.banList || []

function encryptKey(str){
    return crypto.createHmac('md5',SECRET_SALT).update(str).digest('hex')
}

export default async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin","*")
    const apiPath = "/api/admin?data=1"
    //POST接口：增卡/续时/封禁
    if(req.method === "POST"){
        const {type,key,day,newDay}=req.body
        if(type==='create'){
            const ranKey = Math.random().toString(36).slice(2)+Date.now().toString(36)
            global.keyPool.push([ranKey,Number(day)])
            return res.json({code:ranKey})
        }
        if(type==='addTime'){
            const h=encryptKey(key)
            if(global.activeKey[h]){
                let t=new Date(global.activeKey[h])
                t.setDate(t.getDate()+Number(newDay))
                global.activeKey[h]=t
            }
            return res.json({ok:true})
        }
        if(type==='ban'){
            const h=encryptKey(key)
            if(!global.banList.includes(h)) global.banList.push(h)
            return res.json({ok:true})
        }
    }
    //数据查询接口
    if(req.query.data === '1'){
        const activeArr=[]
        for(let hash in global.activeKey){
            activeArr.push({hash,end:global.activeKey[hash],isBan:global.banList.includes(hash)})
        }
        return res.json({pool:global.keyPool,active:activeArr,ban:global.banList})
    }
    //返回管理页面HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>卡密管理后台</title>
</head>
<body style="padding:30px;">
    <div>
        <h3>1.生成新卡密</h3>
        <input id="createDay" placeholder="可用天数" value="1">
        <button onclick="createKey()">生成</button>
        <div>新卡密：<span id="newKey"></span></div>
    </div>
    <div style="margin-top:20px;">
        <h3>2.已激活卡密续时(填明文卡密)</h3>
        <input id="editKey" placeholder="原始卡密">
        <input id="addNum" placeholder="增加天数" value="1">
        <button onclick="addTime()">确认加时</button>
    </div>
    <div style="margin-top:20px;">
        <h3>3.库存未激活卡密列表</h3>
        <div id="poolList"></div>
    </div>
    <div style="margin-top:20px;">
        <h3>4.已激活用户列表</h3>
        <div id="activeList"></div>
    </div>
<script>
const apiUrl = "${apiPath}"
async function loadData(){
    let res=await fetch(apiUrl)
    let d=await res.json()
    let poolHtml=''
    d.pool.forEach(([k,day])=>{
        poolHtml+=`<div>${k} | ${day}天 <button onclick="banKey('${k}')">封禁</button></div>`
    })
    document.getElementById('poolList').innerHTML=poolHtml
    let activeHtml=''
    d.active.forEach(item=>{
        activeHtml+=`<div>密文:${item.hash} | 到期:${new Date(item.end).toLocaleString()} ${item.isBan?'【已封禁】':''} <button onclick="banKey('${item.hash}')">封禁</button></div>`
    })
    document.getElementById('activeList').innerHTML=activeHtml
}
async function createKey(){
    let day=document.getElementById('createDay').value
    let res=await fetch(apiUrl,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({type:'create',day})
    })
    let d=await res.json()
    document.getElementById('newKey').innerText=d.code
    loadData()
}
async function addTime(){
    let k=document.getElementById('editKey').value
    let n=document.getElementById('addNum').value
    await fetch(apiUrl,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({type:'addTime',key:k,newDay:n})
    })
    loadData()
}
async function banKey(k){
    await fetch(apiUrl,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({type:'ban',key:k})
    })
    loadData()
}
window.onload=loadData
</script>
</body>
</html>`
    res.setHeader('Content-Type','text/html;charset=utf-8')
    return res.end(html)
}
