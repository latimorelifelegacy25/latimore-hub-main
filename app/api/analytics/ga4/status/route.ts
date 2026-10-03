export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { requireAdminSession } from '@/lib/ai/shared';
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  try {
    const event = await prisma.systemEvent.findFirst({
      where: { type: "GA4_CONNECTED" },
      orderBy: { createdAt: "desc" },
    });
    if (!event) return NextResponse.json({ connected: false });
    const payload = event.payload as any;
    return NextResponse.json({ connected: true, lastSync: payload?.connected_at });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
