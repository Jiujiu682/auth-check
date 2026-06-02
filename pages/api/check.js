const REST_URL = "https://peaceful-wildcat-141681.upstash.io"
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
const HEADER_AUTH = `Bearer ${REST_TOKEN}`
const SECRET_SALT = "sk5689xd2026#1t"
//可用卡密：[卡密字符,有效天数]
const keyPool = [["ceshi123", 1]]
import crypto from "crypto"

//卡密HMAC加密
const encryptKey = (str) => {
  return crypto.createHmac("md5", SECRET_SALT).update(str).digest("hex")
}

//调用upstash redis
async function runRedis(cmd) {
  const res = await fetch(`${REST_URL}/${cmd}`, {
    headers: { Authorization: HEADER_AUTH }
  })
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  try {
    const { key } = req.body
    const mdStr = encryptKey(key)

    //读取黑名单
    const blackRes = await runRedis("get usedBlackList")
    const blackList = Array.isArray(blackRes.result) ? blackRes.result : []
    if (blackList.includes(mdStr)) return res.json({ ok: false })

    //查询是否已激活在有效期
    const activeData = await runRedis(`get active:${mdStr}`)
    const now = new Date()
    if (activeData.result) {
      const expireTime = new Date(activeData.result)
      if (expireTime <= now) {
        blackList.push(mdStr)
        await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)
        await runRedis(`del active:${mdStr}`)
        return res.json({ ok: false })
      }
      return res.json({ ok: true })
    }

    //校验卡密是否存在
    let dayNum = 0
    for (let [pwd, day] of keyPool) {
      if (encryptKey(pwd) === mdStr) dayNum = day
    }
    if (!dayNum) return res.json({ ok: false })

    //写入redis数据
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + dayNum)
    await runRedis(`set active:${mdStr} "${endDate}"`)
    blackList.push(mdStr)
    await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)

    return res.json({ ok: true })
  } catch (err) {
    //异常直接返回激活失败
    return res.json({ ok: false })
  }
}
