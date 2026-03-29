export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { hotelId } = await params;

  const body = `User-agent: *
Allow: /
Sitemap: http://localhost:3000/sitemap/${hotelId}/sitemap.xml`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
