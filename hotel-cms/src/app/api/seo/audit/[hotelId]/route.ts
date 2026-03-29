import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAccess } from "@/lib/auth";
import { runSeoAudit } from "@/lib/seo/audit";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    const auth = await requireHotelAccess(request, hotelId);
    if (auth.response) return auth.response;

    const result = await runSeoAudit(hotelId);
    return successResponse(result);
  } catch (err) {
    console.error("[POST /api/seo/audit/[hotelId]]", err);
    return errorResponse("Failed to run SEO audit", 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    const auth = await requireHotelAccess(request, hotelId);
    if (auth.response) return auth.response;

    let audit = await prisma.seoAudit.findUnique({ where: { hotelId } });

    if (!audit) {
      const result = await runSeoAudit(hotelId);
      audit = await prisma.seoAudit.findUnique({ where: { hotelId } });
      if (!audit) {
        return successResponse(result);
      }
    }

    return successResponse(audit);
  } catch (err) {
    console.error("[GET /api/seo/audit/[hotelId]]", err);
    return errorResponse("Failed to fetch SEO audit", 500);
  }
}
