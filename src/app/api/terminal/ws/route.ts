import { NextResponse } from 'next/server';

const TERMINAL_WS_URL = process.env.TERMINAL_WS_URL || 'ws://localhost:7861/api/terminal/ws';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: { wsUrl: TERMINAL_WS_URL },
  });
}