import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: false,
    error: { message: 'Discord 集成暂未启用' },
  });
}