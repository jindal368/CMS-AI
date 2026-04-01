import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const start = Date.now();

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: { status: "connected", latencyMs: dbLatency },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        db: { status: "disconnected", error: (err as Error).message },
      },
      { status: 503 }
    );
  }
}
