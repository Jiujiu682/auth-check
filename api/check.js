import {NextResponse} from 'next/server'
const REST_URL = "https://peaceful-wildcat-141681.upstash.io";
const REST_TOKEN = "gQAAAAAAilxAAIgcDJhZjhkMmExMWIyODI0ZTA2YTBhMDU2ZDNlZDFjZWM0ZQ";
const HEADER_AUTH = `Bearer ${REST_TOKEN}`;

async function runRedis(cmd){
  const url = `${REST_URL}?cmd=${encodeURIComponent(cmd)}`
  const res=await fetch(url,{headers:{Authorization:HEADER_AUTH},cache:"no-store"})
  return res.json()
}
export async function GET(){
  // 手动写入test1
  const r1=await runRedis("SET test1 abc123")
  const r2=await runRedis("GET test1")
  return NextResponse.json({setRes:r1,getRes:r2})
}
