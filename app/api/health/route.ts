import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "briefing-note-ai",
    timestamp: new Date().toISOString(),
  });
}
