// pages/api/check.js
const REST_URL = "https://peaceful-wildcat-141681.upstash.io"
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
const HEADER_AUTH = `Bearer ${REST_TOKEN}`
const SECRET_SALT = "sk5689xd2026#1t"
// 卡密列表 【卡密，有效天数】
const keyPool = [["ceshi127", 1]]
import crypto from "crypto"

// MD5加密卡密
const encryptKey = (str) => crypto.createHmac("md5", SECRET_SALT).update(str).digest("hex")

// 请求Upstash接口
async function runRedis(cmdStr) {
  const resp = await fetch(`${REST_URL}/${cmdStr}`, {
    headers: { Authorization: HEADER_AUTH }
  })
  return await resp.json()
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  try {
    const { key } = req.body
    const mdKey = encryptKey(key)

    // 获取已拉黑列表
    const blackRes = await runRedis("get usedBlackList")
    const blackList = Array.isArray(blackRes.result) ? blackRes.result : []
    if (blackList.includes(mdKey)) return res.json({ ok: false })

    // 查询是否在有效期
    const activeRes = await runRedis(`get active:${mdKey}`)
    const now = new Date()
    if (activeRes.result) {
      const expire = new Date(activeRes.result)
      if (expire <= now) {
        blackList.push(mdKey)
        await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)
        await runRedis(`del active:${mdKey}`)
        return res.json({ ok: false })
      }
      return res.json({ ok: true })
    }

    // 匹配可用卡密
    let validDay = 0
    for (let [pwd, day] of keyPool) {
      if (encryptKey(pwd) === mdKey) validDay = day
    }
    if (!validDay) return res.json({ ok: false })

    // 写入Redis
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + validDay)
    await runRedis(`set active:${mdKey} "${expireDate}"`)
    blackList.push(mdKey)
    await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`)

    return res.json({ ok: true })
  } catch (err) {
    // Redis异常直接返回失败
    return res.json({ ok: false })
  }
}
