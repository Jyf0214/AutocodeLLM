import type { WebSocket } from 'ws';
import type { NextRequest } from 'next/server';

import { handleTerminalUpgrade } from '@/lib/terminal/ws-server';

export function UPGRADE(
  client: WebSocket,
  server: import('ws').WebSocketServer,
  request: NextRequest,
) {
  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get('projectId');
  const cols = parseInt(searchParams.get('cols') ?? '80', 10);
  const rows = parseInt(searchParams.get('rows') ?? '24', 10);

  handleTerminalUpgrade(client, projectId, cols, rows);
}
