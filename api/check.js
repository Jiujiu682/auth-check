import { NextResponse } from "next/server";
import crypto from "crypto";

const REST_URL = "https://peaceful-wildcat-141681.upstash.io";
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ";
const HEADER_AUTH = `Bearer ${REST_TOKEN}`;
const SECRET_SALT = "sk5689xd2026#1t";
const keyPool = [["ceshi133", 1],["ceshi136", 1]];

const encryptKey = (str) => crypto.createHmac("md5", SECRET_SALT).update(str).digest("hex");

// Upstash REST标准格式：/CMD/arg1/arg2
async function runRedis(path) {
  const res = await fetch(`${REST_URL}/${path}`, {
    headers: { Authorization: HEADER_AUTH },
  });
  return res.json();
}

export async function GET() {
  return NextResponse.json({msg:"接口正常，POST传key校验"});
}

export async function POST(req) {
  const body = await req.json();
  const { key } = body;
  const mdKey = encryptKey(key);

  // 查询黑名单
  let blackData = await runRedis("GET/usedBlackList");
  let blackList = Array.isArray(blackData.result) ? blackData.result : [];
  if (blackList.includes(mdKey)) return NextResponse.json({ ok: false, msg: "黑名单" });

  // 查询已激活
  let activeData = await runRedis(`GET/active:${mdKey}`);
  const now = new Date();
  if (activeData.result) {
    let expire = new Date(activeData.result);
    if (expire <= now) {
      blackList.push(mdKey);
      await runRedis(`SET/usedBlackList/${JSON.stringify(blackList)}`);
      await runRedis(`DEL/active:${mdKey}`);
      await runRedis(`DEL/raw:${mdKey}`);
      return NextResponse.json({ ok: false, msg: "过期拉黑" });
    }
    let rawRes = await runRedis(`GET/raw:${mdKey}`);
    return NextResponse.json({ ok: true, originKey: rawRes.result });
  }

  // 匹配密钥池天数
  let days = 0;
  let originKey = "";
  for (let [k, d] of keyPool) {
    if (encryptKey(k) === mdKey) {
      days = d;
      originKey = k;
    }
  }
  if (!days) return NextResponse.json({ ok: false, msg: "密钥不存在" });

  // 写入有效期+原始密钥（REST路径无空格）
  let expireDay = new Date();
  expireDay.setDate(expireDay.getDate() + days);
  await runRedis(`SET/active:${mdKey}/${expireDay.toISOString()}`);
  await runRedis(`SET/raw:${mdKey}/${originKey}`);

  return NextResponse.json({ ok: true, day: days, md: mdKey, originKey });
}
