import { NextResponse } from "next/server";
import crypto from "crypto";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "https://peaceful-wildcat-141681.upstash.io",
  token: "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});
const SALT = "sk5689xd2026#1t";
const pool = [["ceshi133",1],["ceshi136",1]];
const md5 = s=>crypto.createHmac("md5",SALT).update(s).digest("hex");

export async function POST(req){
  const {key}=await req.json();
  const hash=md5(key);
  const black=await redis.get("usedBlackList")??[];
  if(black.includes(hash)) return NextResponse.json({ok:false,msg:"黑名单"});
  const expire=await redis.get(`active:${hash}`);
  const now=new Date();
  if(expire){
    const end=new Date(expire);
    if(end<=now){
      black.push(hash);
      await redis.set("usedBlackList",black);
      await redis.del(`active:${hash}`,`raw:${hash}`);
      return NextResponse.json({ok:false,msg:"已过期拉黑"});
    }
    const srcKey=await redis.get(`raw:${hash}`);
    return NextResponse.json({ok:true,originKey:srcKey});
  }
  let day=0,origin="";
  for(let [k,d] of pool){
    if(md5(k)===hash){day=d;origin=k}
  }
  if(!day) return NextResponse.json({ok:false,msg:"密钥不存在"});
  const due=new Date();
  due.setDate(due.getDate()+day);
  await redis.set(`active:${hash}`,due.toISOString());
  await redis.set(`raw:${hash}`,origin);
  return NextResponse.json({ok:true,day,md:hash,originKey:origin});
}
export async function GET(){
  return NextResponse.json({msg:"接口就绪，POST传入key校验"});
}
