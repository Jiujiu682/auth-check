import { createClient } from '@upstash/redis'
import crypto from 'crypto'

// 填入你的Upstash URL、TOKEN
const redis = createClient({
  url: "https://trusted-mayfly-113263.upstash.io",
  token: "gQAAAAAAAbpvAAIgcDExNDY2NDlkYWZlMTA0YzIxYWVkNjlhYmEzNzJmMmM3ZQ"
})
const SECRET_SALT = "sk5689xd2026#1t"
// 测试卡密
const keyPool = [["789369", 1]]

const encryptKey = (str) => crypto.createHmac('md5', SECRET_SALT).update(str).digest('hex')

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  try {
    if (req.method !== 'POST') return res.json({ ok: false })
    const { key } = req.body
    const md5Key = encryptKey(key)

    // 读取黑名单，非数组强制转为空数组
    let blackList = await redis.get('usedBlackList')
    blackList = Array.isArray(blackList) ? blackList : []

    if (blackList.includes(md5Key)) {
      return res.json({ ok: false, msg: "卡密已拉黑" })
    }

    const expireStr = await redis.get(`active:${md5Key}`)
    const now = new Date()
    if (expireStr) {
      const end = new Date(expireStr)
      if (end <= now) {
        blackList.push(md5Key)
        await redis.set('usedBlackList', blackList)
        await redis.del(`active:${md5Key}`)
        return res.json({ ok: false, msg: "已过期" })
      }
      return res.json({ ok: true })
    }

    // 匹配卡密
    let day = 0
    for (let [rawKey, d] of keyPool) {
      if (encryptKey(rawKey) === md5Key) day = d
    }
    if (day === 0) return res.json({ ok: false, msg: "无效卡密" })

    // 写入有效期+黑名单
    let endTime = new Date()
    endTime.setDate(endTime.getDate() + day)
    await redis.set(`active:${md5Key}`, endTime.toString())
    blackList.push(md5Key)
    await redis.set('usedBlackList', blackList)

    return res.json({ ok: true })
  } catch (err) {
    console.log(err)
    return res.json({ ok: false })
  }
}
