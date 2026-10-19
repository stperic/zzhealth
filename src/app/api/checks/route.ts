import { readConfig } from "@/lib/config";
import { checkServices } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		return Response.json(await checkServices(readConfig()), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch {
		return Response.json(
			{ error: "Check the server's target configuration and try again." },
			{
				status: 500,
				headers: { "Cache-Control": "no-store" },
			},
		);
	}
}
