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
  ["tkkfgfm72", 24],
  ["tkk7jq0d7", 24],
  ["tkkbjnpmc", 24],
  ["tkkn0qw8x", 24],
  ["tkkruqj4z", 24],
  ["tkkg14ov6", 24],
  ["tkkc7yf73", 24],
  ["tkkou3ryk", 24],
  ["tkkrzomcx", 24],
  ["tkkrdceig", 24],
  ["tkkq303o4", 24],
  ["tkk01egk8", 24],
  ["tkkruo4r7", 24],
  ["tkkzv1xbx", 24],
  ["tkk38coib", 24],
  ["tkkvvxf4c", 24],
  ["tkk2qrso8", 24],
  ["tkkg3a9vs", 24],
  ["tkkop0q8m", 24],
  ["tkkss4ini", 24],
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ["zkk1ym75l", 168],
  ["zkkio2rso", 168],
  ["zkku5bpvz", 168],
  ["zkkbrkz7o", 168],
  ["zkkh60d45", 168],
  ["zkk83v3s1", 168],
  ["zkk3zr56a", 168],
  ["zkkotjt06", 168],
  ["zkkck2i78", 168],
  ["zkk200mk7", 168],
  ["zkkvnf9sm", 168],
  ["zkkjwv4fk", 168],
  ["zkkttpg1h", 168],
  ["zkkzg6rf6", 168],
  ["zkkb380b8", 168],
  ["zkkzi8um1", 168],
  ["zkksg9bl3", 168],
  ["zkk5k3vz8", 168],
  ["zkk0dnsyy", 168],
  ["zkkktxcl1", 168],
  ["zkks9x5o3", 168],
  ["zkkibleqf", 168],
  ["zkkxye6ba", 168],
  ["zkkbz22vx", 168],
  ["zkkjk5b4n", 168],
  ["zkkcs87lb", 168],
  ["zkkcq7skp", 168],
  ["zkkzwx4ph", 168],
  ["zkk8yczrk", 168],
  ["zkke161fj", 168],
  ["zkkgoy4j2", 168],
  ["zkky7m746", 168],
  ["zkk1cdt97", 168],
  ["zkkppiraj", 168],
  ["zkkxmmv7w", 168],
  ["zkkrc9dko", 168],
  ["zkkgrfdjs", 168],
  ["zkkd9u7vt", 168],
  ["zkk2ihgs6", 168],
  ["zkkwb06ar", 168],
  ["zkkheqs1q", 168],
  ["zkkkvitns", 168],
  ["zkkc7tch1", 168],
  ["zkki9ah02", 168],
  ["zkkiv1kja", 168],
  ["zkkdfcy5l", 168],
  ["zkk3ujst6", 168],
  ["zkkr7io6p", 168],
  ["zkk4opfug", 168],
  ["zkkdk4ee6", 168],
  ["zkkh93165", 168],
  ["zkk1tan9d", 168],
  ["zkkavvxgn", 168],
  ["zkkw435bh", 168],
  ["zkkzllk9l", 168],
  ["zkk0k8xq2", 168],
  ["zkkl5wa8v", 168],
  ["zkkmopbcv", 168],
  ["zkkpjzkn8", 168],
  ["zkkryssjb", 168]
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
