export function GET() {
	return Response.json(
		{ status: "ok", service: "zzhealth" },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
