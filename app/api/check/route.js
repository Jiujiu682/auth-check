import {NextResponse} from "next/server"
export async function POST(){
  return NextResponse.json({msg:"接口通了"})
}
