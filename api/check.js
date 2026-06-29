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
  ["tkkjls4ff", 24],
  ["tkkjweqnm", 24],
  ["tkknfxtlc", 24],
  ["tkkifdezw", 24],
  ["tkktg5g23", 24],
  ["tkk6re9gz", 24],
  ["tkkfaqtbg", 24],
  ["tkk14wb41", 24],
  ["tkke08oxw", 24],
  ["tkk7wclse", 24],
  ["tkkm8ylvf", 24],
  ["tkkg9jlbp", 24],
  ["tkkrj5oqm", 24],
  ["tkkfacfd5", 24],
  ["tkkp4qkt1", 24],
  ["tkkoh4t8h", 24],
  ["tkkx51x0k", 24],
  ["tkkt7gur3", 24],
  ["tkkare8nx", 24],
  ["tkkf7y1uu", 24],
  ["tkk5l2066", 24],
  ["tkk25qdrd", 24],
  ["tkkv17wd8", 24],
  ["tkkcbuw8f", 24],
  ["tkkdcxdbk", 24],
  ["tkkjzl7y3", 24],
  ["tkkh1lra8", 24],
  ["tkksauhuh", 24],
  ["tkk7enyn6", 24],
  ["tkktfrq5v", 24],
  ["tkk389p8t", 24],
  ["tkkalk9cj", 24],
  ["tkk536tlr", 24],
  ["tkkpe58uv", 24],
  ["tkkqmim1q", 24],
  ["tkklt5f9r", 24],
  ["tkkw987hz", 24],
  ["tkkm4nwfy", 24],
  ["tkkzs96s5", 24],
  ["tkkgc28ct", 24],
  ["tkk2e79sw", 24],
  ["tkkfxts4w", 24],
  ["tkkd1yhls", 24],
  ["tkkl1lidu", 24],
  ["tkkvfy1op", 24],
  ["tkkh1lw6p", 24],
  ["tkk3oor0x", 24],
  ["tkknt7chc", 24],
  ["tkk2sh99m", 24],
  ["tkk89ujfj", 24],
  ["tkk01gjiu", 24],
  ["tkki17jpm", 24],
  ["tkk5d5945", 24],
  ["tkk8iwns8", 24],
  ["tkkpuc2cv", 24],
  ["tkky1v6oz", 24],
  ["tkka9ulct", 24],
  ["tkkcm7vtr", 24],
  ["tkkval7k1", 24],
  ["tkk1wq5m7", 24],
  ["tkkmex6x3", 24],
  ["tkknxzp96", 24],
  ["tkk83kj6t", 24],
  ["tkkmeu4nr", 24],
  ["tkk978uza", 24],
  ["tkkybb5po", 24],
  ["tkkgpkac7", 24],
  ["tkk2hp9ft", 24],
  ["tkkjmppe1", 24],
  ["tkkakhg8n", 24],
  ["tkkndkx7b", 24],
  ["tkk9cqwgz", 24],
  ["tkkrrjguj", 24],
  ["tkk2pe1al", 24],
  ["tkka2em8q", 24],
  ["tkkxldcmf", 24],
  ["tkkwntlod", 24],
  ["tkk7xsgqk", 24],
  ["tkkb2vr90", 24],
  ["tkkip7ei1", 24],
  ["tkk730t4i", 24],
  ["tkkrpslxa", 24],
  ["tkk0xecus", 24],
  ["tkkhx4dy7", 24],
  ["tkk622t46", 24],
  ["zkkhx45hj7", 168],
  ["zk13wuco7", 168],
  ["zk6l83dkj", 168],
  ["zkcihgi6b", 168],
  ["zkxmb0rkb", 168],
  ["zk1gdng2d", 168],
  ["zkq8naz0n", 168],
  ["zkka8upkv", 168],
  ["zkypeqs4t", 168],
  ["zkd7a4xhs", 168],
  ["zksuskp7z", 168],
  ["zk62oht0b", 168],
  ["zk08toqjc", 168],
  ["zknnnzh9i", 168],
  ["zk3s8cl9h", 168],
  ["zke3vice6", 168],
  ["zk1k20e91", 168],
  ["zk1bdxio7", 168],
  ["zklonox8p", 168],
  ["zkp4ql745", 168],
  ["zkr7p6tw7", 168],
  ["zk5n8wjpx", 168],
  ["zkn8p8o6l", 168],
  ["zkvudw4cv", 168],
  ["zkcf81su9", 168],
  ["zkq7qtud3", 168],
  ["zkn1ft7v0", 168],
  ["zkfbewk1y", 168],
  ["zk82mvjm0", 168],
  ["zktk5ew97", 168],
  ["zkimj3p55", 168],
  ["yk0t9ywste", 720],
  ["ykr503omkc", 720],
  ["ykwsxqa6f6", 720],
  ["yky3f0n8a5", 720],
  ["yk7sdgg8wx", 720],
  ["ykfxv4i0jj", 720],
  ["ykn7nz946a", 720],
  ["ykdsimhkb8", 720],
  ["yk0ihfmufx", 720],
  ["ykdrzj3yno", 720],
  ["sidrzj", 4]
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
