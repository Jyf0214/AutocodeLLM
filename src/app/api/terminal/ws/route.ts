import { NextResponse } from 'next/server';

export function GET() {
  const wsUrl = process.env.WS_URL ?? 'ws://localhost:3000';
  return NextResponse.json({
    success: true,
    data: { wsUrl: wsUrl + '/api/terminal/ws' },
  });
}
