import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis.fromEnv({
  url:"https://peaceful-wildcat-141681.upstash.io",
  token:"gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});
const salt = "sk5689xd2026#1t";
//白名单[密钥,小时数]
const list = [["sanceshi135",3]];
//禁用名单：写在这里，不管有没有开通一律拉黑
const banKey = ["ceshi133"];

const md5=s=>crypto.createHmac("md5",salt).update(s).digest("hex");

export const runtime = "edge";

export async function POST(req){
  try{
    const {key}=await req.json();
    //第一步：匹配禁用列表直接拦截
    if(banKey.includes(key)){
      const h=md5(key);
      let bl=await redis.get("usedBlackList")||[];
      if(!bl.includes(h)){
        bl.push(h);
        await redis.set("usedBlackList",bl);
        await redis.del(`active:${h}`,`raw:${h}`,`start:${h}`);
      }
      return NextResponse.json({ok:false,msg:"密钥已封禁"});
    }

    const h=md5(key);
    const black=await redis.get("usedBlackList")||[];
    if(black.includes(h)) return NextResponse.json({ok:false,msg:"黑名单"});
    const exp=await redis.get(`active:${h}`);

    //已有激活记录
    if(exp){
      const expireDate=new Date(exp);
      const now=new Date();
      //已过期拉入黑名单
      if(expireDate<=now){
        black.push(h);
        await redis.set("usedBlackList",black);
        await redis.del(`active:${h}`,`raw:${h}`,`start:${h}`);
        return NextResponse.json({ok:false,msg:"过期拉黑"});
      }
      //读取激活时间
      const startStr=await redis.get(`start:${h}`);
      const startDate=new Date(startStr);
      const leftMs=expireDate.getTime()-now.getTime();
      const leftHour=Number((leftMs/3600000).toFixed(2));
      return NextResponse.json({
        ok:true,
        originKey:await redis.get(`raw:${h}`),
        activeTime:Math.floor(startDate.getTime()/1000),
        expireTime:Math.floor(expireDate.getTime()/1000),
        leftHour:leftHour
      });
    }

    //首次激活
    let hour=0,src="";
    for(let [k,d]of list){
      if(md5(k)===h){hour=d;src=k;}
    }
    if(!hour)return NextResponse.json({ok:false,msg:"密钥不存在"});

    const now=new Date();
    const end=new Date();
    end.setHours(end.getHours()+hour);
    //存：到期时间、原始密钥、首次激活时间
    await redis.set(`active:${h}`,end.toISOString());
    await redis.set(`raw:${h}`,src);
    await redis.set(`start:${h}`,now.toISOString());

    const leftHour=Number(hour.toFixed(2));
    return NextResponse.json({
      ok:true,
      originKey:src,
      activeTime:Math.floor(now.getTime()/1000),
      expireTime:Math.floor(end.getTime()/1000),
      leftHour:leftHour
    });
  }catch(e){
    return NextResponse.json({ok:false,err:e.message});
  }
}
export async function GET(){
  return NextResponse.json({msg:"正常"});
}
