import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis.fromEnv({
  url:"https://peaceful-wildcat-141681.upstash.io",
  token:"gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});
const salt = "sk5689xd2026#1t";
const list = [["tkkceshi1200",168],["tkkceshi1224",168],["tkkceshi1300",24],["tkkceshi1327",24],["tkkceshi1378",24],["tkkceshi1479",24],["tkkceshi1372",24],["tkkceshi1450",24],["tkkceshi1422",24],["tkkceshi1428",24]
             ,["tkkceshi1532",24],["tkkceshi1578",24],["tkkceshi1523",24],["tkkceshi1549",24],["tkkceshi1672",24],["tkkceshi1655",24],["tkkceshi1611",24]];
const banKey = ["ceshi133"];["tkkceshi1134"]

const md5=s=>crypto.createHmac("md5",salt).update(s).digest("hex");
//北京时间格式化
const formatTime = (sec)=>{
  const d = new Date(sec*1000 + 8*3600*1000);
  return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}/${d.getHours()}:${d.getMinutes()}`
};

export const runtime = "edge";

export async function POST(req){
  try{
    const {key,type}=await req.json();
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

    //已激活的卡：不管查询/激活，只校验剩余时间
    if(exp){
      const expireDate=new Date(exp);
      const now=new Date();
      if(expireDate<=now){
        black.push(h);
        await redis.set("usedBlackList",black);
        await redis.del(`active:${h}`,`raw:${h}`,`start:${h}`);
        return NextResponse.json({ok:false,msg:"过期拉黑"});
      }
      const startStr=await redis.get(`start:${h}`);
      const startDate=new Date(startStr);
      const leftMs=expireDate.getTime()-now.getTime();
      const leftHour=Number((leftMs/3600000).toFixed(2));

      const activeTs = Math.floor(startDate.getTime()/1000);
      const expireTs = Math.floor(expireDate.getTime()/1000);

      return NextResponse.json({
        ok:true,
        originKey:await redis.get(`raw:${h}`),
        activeTime:activeTs,
        activeDate:formatTime(activeTs),
        expireTime:expireTs,
        expireDate:formatTime(expireTs),
        leftHour:leftHour
      });
    }

    let hour=0,src="";
    for(let [k,d]of list){
      if(md5(k)===h){hour=d;src=k;}
    }
    if(!hour)return NextResponse.json({ok:false,msg:"密钥不存在"});

    //【type=query：只查卡，不激活、不存数据】
    if(type === "query"){
      const now=new Date();
      const end=new Date();
      end.setHours(end.getHours()+hour);
      const activeTs = Math.floor(now.getTime()/1000);
      const expireTs = Math.floor(end.getTime()/1000);
      return NextResponse.json({
        ok:true,
        originKey:src,
        activeTime:activeTs,
        activeDate:formatTime(activeTs),
        expireTime:expireTs,
        expireDate:formatTime(expireTs),
        leftHour:hour,
        state:"未激活"
      });
    }

    //【type=active：用户正式激活，写入Redis】
    const now=new Date();
    const end=new Date();
    end.setHours(end.getHours()+hour);
    await redis.set(`active:${h}`,end.toISOString());
    await redis.set(`raw:${h}`,src);
    await redis.set(`start:${h}`,now.toISOString());

    const leftHour=Number(hour.toFixed(2));
    const activeTs = Math.floor(now.getTime()/1000);
    const expireTs = Math.floor(end.getTime()/1000);

    return NextResponse.json({
      ok:true,
      originKey:src,
      activeTime:activeTs,
      activeDate:formatTime(activeTs),
      expireTime:expireTs,
      expireDate:formatTime(expireTs),
      leftHour:leftHour,
      state:"已激活"
    });
  }catch(e){
    return NextResponse.json({ok:false,err:e.message});
  }
}
export async function GET(){
  return NextResponse.json({msg:"正常"});
}
