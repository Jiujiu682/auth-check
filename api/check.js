import { NextResponse } from "next/server";
import crypto from "crypto";

const REST_URL = "https://peaceful-wildcat-141681.upstash.io";
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ";
const HEADER_AUTH = `Bearer ${REST_TOKEN}`;
const SECRET_SALT = "sk5689xd2026#1t";
const keyPool = [["ceshi133", 1],["ceshi135", 1],["ceshi137",1]];

const encryptKey = (str) => crypto.createHmac("md5", SECRET_SALT).update(str).digest("hex");

async function runRedis(cmd) {
  const arr = cmd.split(" ");
  const path = arr.join("/");
  const res = await fetch(`${REST_URL}/${path}`, {headers:{Authorization:HEADER_AUTH}})
  return res.json();
}

export async function GET(){
  return NextResponse.json({msg:"POST传入key使用"});
}

export async function POST(req){
  const {key}=await req.json();
  const md = encryptKey(key);

  let blackRes = await runRedis("GET usedBlackList");
  let black = Array.isArray(blackRes.result)?blackRes.result:[];
  if(black.includes(md)) return NextResponse.json({ok:false});

  let activeRes = await runRedis(`GET active:${md}`);
  const now = new Date();
  if(activeRes.result){
    const exp = new Date(activeRes.result);
    if(exp<=now){
      black.push(md);
      await runRedis(`SET usedBlackList ${JSON.stringify(black)}`);
      await runRedis(`DEL active:${md}`);
      return NextResponse.json({ok:false});
    }
    return NextResponse.json({ok:true});
  }

  let day = 0;
  for(let [k,d] of keyPool){
    if(k===key) day=d;
  }
  if(!day) return NextResponse.json({ok:false});

  let expDay = new Date();
  expDay.setDate(expDay.getDate()+day);
  await runRedis(`SET active:${md} ${expDay.toISOString()}`);
  return NextResponse.json({ok:true});
}
