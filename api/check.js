import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis({
  url: "https://peaceful-wildcat-141681.upstash.io",
  token: "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});
const salt = "sk5689xd2026#1t";
const validKeys = [["ceshi133", 1], ["ceshi136", 1]];

function getMd5(str) {
  return crypto.createHmac("md5", salt).update(str).digest("hex");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const inputKey = body.key;
    const hash = getMd5(inputKey);

    const blackArr = await redis.get("usedBlackList") || [];
    if (blackArr.includes(hash)) {
      return NextResponse.json({ ok: false, msg: "黑名单" });
    }

    const expireStr = await redis.get(`active:${hash}`);
    const now = new Date();
    if (expireStr) {
      const endTime = new Date(expireStr);
      if (endTime <= now) {
        blackArr.push(hash);
        await redis.set("usedBlackList", blackArr);
        await redis.del(`active:${hash}`, `raw:${hash}`);
        return NextResponse.json({ ok: false, msg: "过期拉黑" });
      }
      const origin = await redis.get(`raw:${hash}`);
      return NextResponse.json({ ok: true, originKey: origin });
    }

    let day = 0, originKey = "";
    for (let [k, d] of validKeys) {
      if (getMd5(k) === hash) {
        day = d;
        originKey = k;
      }
    }
    if (!day) return NextResponse.json({ ok: false, msg: "密钥不存在" });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + day);
    await redis.set(`active:${hash}`, endDate.toISOString());
    await redis.set(`raw:${hash}`, originKey);
    return NextResponse.json({ ok: true, day, md: hash, originKey });
  } catch (e) {
    return NextResponse.json({ ok: false, err: e.message });
  }
}

export async function GET() {
  return NextResponse.json({ msg: "接口正常" });
}
