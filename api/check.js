import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis.fromEnv({
  url: "https://peaceful-wildcat-141681.upstash.io",
  token: "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});

const salt = "sk5689xd2026#1t";
// 卡密列表 [卡密, 小时数]
const cardList = [
  ["tkkceshi5795", 24],
  ["tkkceshi5788", 24],
  ["tkkceshi5724", 24],
  ["tkkceshi5928", 24],
  ["tkkceshi6134", 24],
  ["tkkceshi6722", 24],
  ["tkkceshi6254", 24],
  ["tkkceshi7435", 24],
  ["tkkceshi5432", 24],
  ["tkkceshi5847", 24],
  ["tkkceshi5925", 24],
  ["tkkceshi6797", 24],
  ["tkkceshi7432", 24],
  ["tkkceshi7699", 24],
  ["tkkceshi8154", 24]
];
// 封禁卡密（修复原语法错误）
const banKey = ["ceshi133", "tkkceshi1134"];

// HMAC-MD5 加密
const md5 = (s) => crypto.createHmac("md5", salt).update(s).digest("hex");

// 北京时间格式化
const formatTime = (sec) => {
  const d = new Date(sec * 1000 + 8 * 3600 * 1000);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}/${d.getHours()}:${d.getMinutes()}`;
};

export const runtime = "edge";

export async function POST(req) {
  try {
    const body = await req.json();
    const { key, type } = body || {};

    // 1. 入参非空校验
    if (!key || typeof key !== "string") {
      return NextResponse.json({ ok: false, msg: "密钥不能为空" });
    }

    // 2. 校验全局封禁列表
    if (banKey.includes(key)) {
      const h = md5(key);
      let bl = await redis.get("usedBlackList") || [];
      if (!Array.isArray(bl)) bl = [];
      if (!bl.includes(h)) {
        bl.push(h);
        await redis.set("usedBlackList", bl);
        await redis.del(`active:${h}`, `raw:${h}`, `start:${h}`);
      }
      return NextResponse.json({ ok: false, msg: "密钥已封禁" });
    }

    const h = md5(key);
    // 3. 读取黑名单并容错
    let blackList = await redis.get("usedBlackList") || [];
    if (!Array.isArray(blackList)) blackList = [];
    if (blackList.includes(h)) {
      return NextResponse.json({ ok: false, msg: "黑名单" });
    }

    // 4. 已激活的卡密：计算剩余时间
    const expireStr = await redis.get(`active:${h}`);
    if (expireStr) {
      const expireDate = new Date(expireStr);
      const now = new Date();

      // 已过期 → 加入黑名单并清理数据
      if (expireDate <= now) {
        blackList.push(h);
        await redis.set("usedBlackList", blackList);
        await redis.del(`active:${h}`, `raw:${h}`, `start:${h}`);
        return NextResponse.json({ ok: false, msg: "过期拉黑" });
      }

      const startStr = await redis.get(`start:${h}`);
      const startDate = new Date(startStr);
      const leftMs = expireDate.getTime() - now.getTime();
      const leftHour = Number((leftMs / 3600000).toFixed(2));
      const remainSecond = Math.floor(leftMs / 1000); // 剩余秒数 → 给客户端使用

      const activeTs = Math.floor(startDate.getTime() / 1000);
      const expireTs = Math.floor(expireDate.getTime() / 1000);

      return NextResponse.json({
        ok: true,
        originKey: await redis.get(`raw:${h}`),
        activeTime: activeTs,
        activeDate: formatTime(activeTs),
        expireTime: expireTs,
        expireDate: formatTime(expireTs),
        leftHour: leftHour,
        remain_second: remainSecond // 新增：客户端需要的剩余秒数
      });
    }

    // 5. 未激活：匹配卡密时长
    let validHour = 0;
    let srcKey = "";
    for (const [k, d] of cardList) {
      if (md5(k) === h) {
        validHour = d;
        srcKey = k;
        break;
      }
    }
    if (!validHour) {
      return NextResponse.json({ ok: false, msg: "密钥不存在" });
    }

    const now = new Date();
    const end = new Date();
    end.setHours(end.getHours() + validHour);
    const totalSecond = validHour * 3600; // 总秒数

    // 6. 仅查询模式 type=query
    if (type === "query") {
      const activeTs = Math.floor(now.getTime() / 1000);
      const expireTs = Math.floor(end.getTime() / 1000);
      return NextResponse.json({
        ok: true,
        originKey: srcKey,
        activeTime: activeTs,
        activeDate: formatTime(activeTs),
        expireTime: expireTs,
        expireDate: formatTime(expireTs),
        leftHour: validHour,
        remain_second: totalSecond, // 剩余秒数
        state: "未激活"
      });
    }

    // 7. 正式激活 type=active
    await redis.set(`active:${h}`, end.toISOString());
    await redis.set(`raw:${h}`, srcKey);
    await redis.set(`start:${h}`, now.toISOString());

    const leftHour = Number(validHour.toFixed(2));
    const activeTs = Math.floor(now.getTime() / 1000);
    const expireTs = Math.floor(end.getTime() / 1000);

    return NextResponse.json({
      ok: true,
      originKey: srcKey,
      activeTime: activeTs,
      activeDate: formatTime(activeTs),
      expireTime: expireTs,
      expireDate: formatTime(expireTs),
      leftHour: leftHour,
      remain_second: totalSecond, // 剩余秒数
      state: "已激活"
    });

  } catch (e) {
    return NextResponse.json({ ok: false, err: e.message });
  }
}

export async function GET() {
  return NextResponse.json({ msg: "正常" });
}
