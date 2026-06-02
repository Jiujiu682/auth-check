import { NextResponse } from "next/server";
import crypto from "crypto";

const REST_URL = "https://peaceful-wildcat-141681.upstash.io";
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ";
const HEADER_AUTH = `Bearer ${REST_TOKEN}`;
const SECRET_SALT = "sk5689xd2026#1t";
const keyPool = [["ceshi133", 1],["ceshi135", 1],["ceshi137",1]];

const encryptKey = (str) => crypto.createHmac("md5", SECRET_SALT).update(str).digest("hex");

async function runRedis(cmd) {
  const res = await fetch(`${REST_URL}/${encodeURIComponent(cmd)}`, {
    headers: { Authorization: HEADER_AUTH }
  })
  return res.json();
}

export async function GET() {
  return NextResponse.json({msg:"接口正常，POST传key校验"});
}

export async function POST(req) {
  const body = await req.json();
  const { key } = body;
  const mdKey = encryptKey(key);

  let blackData = await runRedis("GET usedBlackList");
  let blackList = Array.isArray(blackData.result) ? blackData.result : [];
  if (blackList.includes(mdKey)) return NextResponse.json({ ok: false });

  let activeData = await runRedis(`GET active:${mdKey}`);
  const now = new Date();
  if (activeData.result) {
    let expire = new Date(activeData.result);
    if (expire <= now) {
      blackList.push(mdKey);
      await runRedis(`SET usedBlackList ${JSON.stringify(blackList)}`);
      await runRedis(`DEL active:${mdKey}`);
      return NextResponse.json({ ok: false });
    }
    return NextResponse.json({ ok: true });
  }

  let days = 0;
  for (let [k, d] of keyPool) {
    if (k === key) days = d;
  }
  if (!days) return NextResponse.json({ ok: false });

  let expireDay = new Date();
  expireDay.setDate(expireDay.getDate() + days);
  await runRedis(`SET active:${mdKey} ${expireDay.toISOString()}`);
  return NextResponse.json({ ok: true });
}
