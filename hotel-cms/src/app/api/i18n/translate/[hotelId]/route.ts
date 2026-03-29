import { type NextRequest } from "next/server";
import { requireHotelAccess } from "@/lib/auth";
import { translateHotelSite } from "@/lib/i18n/translate";
import { errorResponse, successResponse } from "@/lib/api-utils";

export const maxDuration = 180;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    const auth = await requireHotelAccess(request, hotelId);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { targetLocale, targetLanguage } = body as Record<string, unknown>;

    if (!targetLocale || typeof targetLocale !== "string" || targetLocale.trim() === "") {
      return errorResponse("targetLocale is required", 400);
    }
    if (!targetLanguage || typeof targetLanguage !== "string" || targetLanguage.trim() === "") {
      return errorResponse("targetLanguage is required", 400);
    }

    const { pagesTranslated, sectionsTranslated } = await translateHotelSite(
      hotelId,
      targetLocale,
      targetLanguage
    );

    return successResponse({
      pagesTranslated,
      sectionsTranslated,
      locale: targetLocale,
      language: targetLanguage,
    });
  } catch (err) {
    console.error("[POST /api/i18n/translate/[hotelId]]", err);
    return errorResponse("Failed to translate hotel site", 500);
  }
}
