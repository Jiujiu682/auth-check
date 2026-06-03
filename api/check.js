import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis.fromEnv({
  url:"https://peaceful-wildcat-141681.upstash.io",
  token:"gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ"
});
const salt = "sk5689xd2026#1t";
const list = [["sanceshi135",3],["sanceshi221",3],["sanceshi215",3],["sanceshi246",3],["sanceshi238",3],["sanceshi289",3],["sanceshi334",3],["sanceshi337",3],["sanceshi349",3],["sanceshi525",3],["sanceshi529",3],
             ["sanceshi727",3],["sanceshi828",3],["sanceshi666",3],["sanceshi323",3],["sanceshi198",3],["sanceshi654",3],["sanceshi643",3],["sanceshi618",3],["sanceshi679",3],["sanceshi725",3],["sanceshi758",3],
             ["sanceshi768",3],["sanceshi985",3],["sanceshi548",3],["sanceshi521",3],["sanceshi597",3],["Tkceshi598",24],["tkkceshi672",24],];
const banKey = ["ceshi133"];

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
