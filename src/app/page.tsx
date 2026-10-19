import { Dashboard } from "@/components/dashboard";
import { readConfig } from "@/lib/config";
import { checkServices, type HealthReport } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function Home() {
	let initialReport: HealthReport | null = null;
	try {
		initialReport = await checkServices(readConfig());
	} catch {
		// Keep a usable page when operator configuration needs correction.
	}
	return <Dashboard initialReport={initialReport} />;
}
