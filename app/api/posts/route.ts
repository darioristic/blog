import { NextResponse } from "next/server";
import { getPostsLive } from "../../get-posts";

export async function GET() {
  return NextResponse.json(await getPostsLive());
}
