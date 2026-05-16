import { NextResponse } from 'next/server';

import { withApiLogging } from '@/lib/log';
const TERMINAL_WS_URL = process.env.TERMINAL_WS_URL ?? 'ws://localhost:7860/api/terminal/ws';

export const GET = withApiLogging('GET terminal/ws', function GET()  {
  return NextResponse.json({
    success: true,
    data: { wsUrl: TERMINAL_WS_URL },
  });
});