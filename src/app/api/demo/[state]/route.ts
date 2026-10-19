import { setTimeout } from "node:timers/promises";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/demo/[state]">,
) {
	const { state } = await context.params;
	if (state === "slow") await setTimeout(350);
	const status =
		state === "down" ? 503 : ["healthy", "slow"].includes(state) ? 200 : 404;
	return Response.json(
		{ demo: true, state },
		{ status, headers: { "Cache-Control": "no-store" } },
	);
}
