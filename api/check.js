const REST_URL = "https://peaceful-wildcat-141681.upstash.io"
const REST_TOKEN = "gQAAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
const HEADER_AUTH = `Bearer ${REST_TOKEN}`
const SECRET_SALT = "sk5689xd2026#1t"
//测试卡密：ceshi123，1天有效期
const keyPool = [["ceshi123", 1]]
import crypto from "crypto"

//MD5加密卡密
const encryptKey = (str) => crypto.createHmac("md5", SECRET_SALT).update(str).digest("hex")

//封装Redis http指令
async function runRedis(cmdStr) {
  const resp = await fetch(`${REST_URL}/${cmdStr}`, {
    headers: { Authorization: HEADER_AUTH }
  })
  return await resp.json()
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  try {
    if (req.method !== "POST") return res.json({ ok: false })
    const { key } = req.body
    const encryptStr = encryptKey(key)

    //读取黑名单
    const blackRes = await runRedis("get usedBlackList")
    let blackList = Array.isArray(blackRes.result) ? blackRes.result : []
    if (blackList.includes(encryptStr)) return res.json({ ok: false })

    //读取过期时间
    const expireRes = await runRedis(`get active:${encryptStr}`)
    const now = new Date()
    if (expireRes.result) {
      const endTime = new Date(expireRes.result)
      if (endTime <= now) {
        blackList.push(encryptStr)
        await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)
        await runRedis(`del active:${encryptStr}`)
        return res.json({ ok: false })
      }
      return res.json({ ok: true })
    }

    //匹配卡密天数
    let validDay = 0
    for (let [k, d] of keyPool) {
      if (encryptKey(k) === encryptStr) validDay = d
    }
    if (validDay === 0) return res.json({ ok: false })

    //写入有效期
    let endDate = new Date()
    endDate.setDate(endDate.getDate() + validDay)
    await runRedis(`set active:${encryptStr} "${endDate}"`)
    blackList.push(encryptStr)
    await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)

    return res.json({ ok: true })
  } catch (err) {
    //报错统一返回false，不再500页面
    return res.json({ ok: false })
  }
}
