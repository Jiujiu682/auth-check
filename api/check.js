import { NextResponse } from "next/server";
import crypto from "crypto";
import { Redis } from "@upstash/redis";

const redis = Redis.fromConfig({
  url: "https://peaceful-wildcat-141681.upstash.io",
  token: "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});

const SECRET_SALT = "sk5689xd2026#1t";
const keyPool = [["ceshi133", 1],["ceshi136", 1]];
const encryptKey = s => crypto.createHmac("md5",SECRET_SALT).update(s).digest("hex");

export async function POST(req){
  const {key}=await req.json();
  const md=encryptKey(key);
  let black=await redis.get("usedBlackList")||[];
  if(black.includes(md))return NextResponse.json({ok:false,msg:"黑名单"});
  const exp=await redis.get(`active:${md}`);
  const now=new Date();
  if(exp){
    const ed=new Date(exp);
    if(ed<=now){
      black.push(md);
      await redis.set("usedBlackList",black);
      await redis.del(`active:${md}`,`raw:${md}`);
      return NextResponse.json({ok:false,msg:"过期拉黑"});
    }
    const ok=await redis.get(`raw:${md}`);
    return NextResponse.json({ok:true,originKey:ok});
  }
  let day=0,origin="";
  for(let [k,d]of keyPool){
    if(encryptKey(k)===md){day=d;origin=k}
  }
  if(!day)return NextResponse.json({ok:false,msg:"密钥不存在"});
  const end=new Date();
  end.setDate(end.getDate()+day);
  await redis.set(`active:${md}`,end.toISOString());
  await redis.set(`raw:${md}`,origin);
  return NextResponse.json({ok:true,day,md,originKey:origin});
}
export async function GET(){
  return NextResponse.json({msg:"接口正常，POST传key校验"});
}
