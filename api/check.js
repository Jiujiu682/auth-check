import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis.fromEnv({
  url:"https://peaceful-wildcat-141681.upstash.io",
  token:"gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});
const salt = "sk5689xd2026#1t";
const list = [["ceshi133",1],["ceshi135",1]];
const md5=s=>crypto.createHmac("md5",salt).update(s).digest("hex");

export const runtime = "edge";

export async function POST(req){
  try{
    const {key}=await req.json();
    const h=md5(key);
    const black=await redis.get("usedBlackList")||[];
    if(black.includes(h)) return NextResponse.json({ok:false,msg:"黑名单"});
    const exp=await redis.get(`active:${h}`);
    if(exp){
      if(new Date(exp)<=new Date()){
        black.push(h);
        await redis.set("usedBlackList",black);
        await redis.del(`active:${h}`,`raw:${h}`);
        return NextResponse.json({ok:false,msg:"过期拉黑"});
      }
      return NextResponse.json({ok:true,originKey:await redis.get(`raw:${h}`)});
    }
    let day=0,src="";
    for(let [k,d]of list){
      if(md5(k)===h){day=d;src=k;}
    }
    if(!day)return NextResponse.json({ok:false,msg:"密钥不存在"});
    const end=new Date();
    end.setDate(end.getDate()+day);
    await redis.set(`active:${h}`,end.toISOString());
    await redis.set(`raw:${h}`,src);
    return NextResponse.json({ok:true,day,originKey:src});
  }catch(e){
    return NextResponse.json({ok:false,err:e.message});
  }
}
export async function GET(){
  return NextResponse.json({msg:"正常"});
}
