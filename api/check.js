import { NextResponse } from "next/server";
import crypto from "crypto";

const REST_URL = "https://peaceful-wildcat-141681.upstash.io";
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ";
const HEADER_AUTH = `Bearer ${REST_TOKEN}`;
const SECRET_SALT = "sk5689xd2026#1t";
const keyPool = [["ceshi133", 1],["ceshi136", 1]];

const encryptKey = (str) => crypto.createHmac("md5", SECRET_SALT).update(str).digest("hex");

async function runRedis(cmd) {
  const res = await fetch(`${REST_URL}/${cmd}`, {
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

  let blackData = await runRedis("get usedBlackList");
  let blackList = Array.isArray(blackData.result) ? blackData.result : [];
  if (blackList.includes(mdKey)) return NextResponse.json({ ok: false, msg: "黑名单" });

  let activeData = await runRedis(`get active:${mdKey}`);
  const now = new Date();
  if (activeData.result) {
    let expire = new Date(activeData.result);
    if (expire <= now) {
      blackList.push(mdKey);
      await runRedis(`set usedBlackList ${JSON.stringify(blackList)}`);
      await runRedis(`del active:${mdKey}`);
      await runRedis(`del raw:${mdKey}`);
      return NextResponse.json({ ok: false, msg: "过期拉黑" });
    }
    let rawRes = await runRedis(`get raw:${mdKey}`);
    return NextResponse.json({ ok: true, originKey: rawRes.result });
  }

  let days = 0;
  let originKey = "";
  for (let [k, d] of keyPool) {
    if (encryptKey(k) === mdKey) {
      days = d;
      originKey = k;
    }
  }
  if (!days) return NextResponse.json({ ok: false, msg: "密钥不存在" });

  let expireDay = new Date();
  expireDay.setDate(expireDay.getDate() + days);
  await runRedis(`set active:${mdKey} "${expireDay.toISOString()}"`);
  await runRedis(`set raw:${mdKey} ${originKey}`);
  return NextResponse.json({ ok: true, day: days, md: mdKey, originKey });
}
