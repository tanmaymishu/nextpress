import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Hello from Next.js API route!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}