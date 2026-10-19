"use client";

import Link from "next/link";
import { useState } from "react";
import type { HealthReport, HealthStatus } from "@/lib/health";

const labels: Record<HealthStatus, string> = {
	healthy: "Healthy",
	slow: "Slow",
	down: "Down",
};

export function Dashboard({
	initialReport,
}: {
	initialReport: HealthReport | null;
}) {
	const [report, setReport] = useState(initialReport);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(
		initialReport
			? ""
			: "Checks unavailable. Check the server's target configuration.",
	);

	async function refresh() {
		setLoading(true);
		setError("");
		try {
			const response = await fetch("/api/checks", {
				cache: "no-store",
				signal: AbortSignal.timeout(10000),
			});
			if (!response.ok) throw new Error("Checks unavailable");
			setReport((await response.json()) as HealthReport);
		} catch {
			setError(
				"Could not refresh. Showing the last results, if available. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}

	const counts = { healthy: 0, slow: 0, down: 0 };
	for (const service of report?.services ?? []) counts[service.status]++;
	const needsAttention = counts.slow + counts.down;

	return (
		<div className="shell">
			<header className="topbar">
				<Link className="brand" href="/" aria-label="zzhealth home">
					<span className="brand-icon" aria-hidden="true">
						z<span>z</span>
					</span>
					zzhealth<span className="brand-divider">/</span>
					<span className="workspace">Service monitor</span>
				</Link>
				<span className="environment">
					<span className="dot" />
					{report?.mode === "demo" ? "Local demo" : "Configured services"}
				</span>
			</header>

			<main>
				<div className="heading-row">
					<div>
						<p className="eyebrow">OVERVIEW</p>
						<h1>Service health</h1>
						<p className="subtitle">
							A clear view of what is responding, and what needs attention.
						</p>
					</div>
					<button
						className="refresh"
						type="button"
						onClick={refresh}
						disabled={loading}
					>
						<span aria-hidden="true">↻</span>
						{loading ? "Checking…" : "Refresh checks"}
					</button>
				</div>

				<div aria-live="polite" className="check-summary">
					<span
						className={`summary-mark ${needsAttention ? "attention" : "healthy"}`}
						aria-hidden="true"
					>
						{needsAttention ? "!" : "✓"}
					</span>
					<div>
						<strong>
							{report
								? needsAttention
									? `${needsAttention} services need attention`
									: "All services are healthy"
								: "Waiting for check results"}
						</strong>
						<p>
							{report?.mode === "demo"
								? "Demo endpoints show a healthy response, a slow response and an outage."
								: "Each refresh makes a new HTTP request to your configured services."}
						</p>
					</div>
				</div>
				{error && (
					<p className="error" role="alert">
						{error}
					</p>
				)}

				<section className="metrics" aria-label="Service summary">
					<div className="metric">
						<span className="metric-label">Monitored services</span>
						<strong>{report?.services.length ?? "·"}</strong>
						<small>HTTP endpoints</small>
					</div>
					{(["healthy", "slow", "down"] as const).map((status) => (
						<div className={`metric ${status}`} key={status}>
							<span className="metric-label">
								<i className="dot" />
								{labels[status]}
							</span>
							<strong>{report ? counts[status] : "·"}</strong>
							<small>
								{status === "healthy"
									? "Within response threshold"
									: status === "slow"
										? "Above response threshold"
										: "Unsuccessful or unreachable"}
							</small>
						</div>
					))}
				</section>

				<section className="services" aria-labelledby="services-heading">
					<div className="section-heading">
						<h2 id="services-heading">
							Your services{" "}
							<span className="service-count">
								{report?.services.length ?? 0}
							</span>
						</h2>
						<span className="latest">Latest check</span>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th scope="col">Service</th>
									<th scope="col">Status</th>
									<th scope="col">Response time</th>
									<th scope="col">Result</th>
								</tr>
							</thead>
							<tbody>
								{report?.services.map((service) => (
									<tr key={service.id}>
										<th scope="row">
											<span className="service-name">{service.name}</span>
											<span className="service-origin">{service.origin}</span>
										</th>
										<td>
											<span className={`status ${service.status}`}>
												<i className="dot" />
												{labels[service.status]}
											</span>
										</td>
										<td className="latency">
											{service.latencyMs}
											<span className="latency-unit"> ms</span>
										</td>
										<td>
											<span className="result-detail">{service.detail}</span>
											<span className="http-status">
												{service.httpStatus === null
													? "No HTTP response"
													: `HTTP ${service.httpStatus}`}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!report && (
						<p className="empty">
							No results yet. Correct the configuration, then refresh.
						</p>
					)}
					<div className="table-footer">
						<span>
							<span className="dot" />
							Checks run on page load and refresh
						</span>
						<span>
							{report ? (
								<>
									Checked{" "}
									<time dateTime={report.checkedAt}>
										{report.checkedAt.slice(11, 19)} UTC
									</time>
								</>
							) : (
								"No completed check"
							)}
						</span>
					</div>
				</section>

				<aside className="explanation">
					<span className="info-icon" aria-hidden="true">
						i
					</span>
					<div>
						<strong>One check, a current snapshot.</strong>
						<p>
							Healthy means HTTP 2xx below {report?.slowMs ?? 200} ms. Slow
							means HTTP 2xx at or above that threshold. Other responses and
							requests exceeding {(report?.timeoutMs ?? 2000) / 1000} seconds
							are down. Results are snapshots, not uptime history.
						</p>
					</div>
				</aside>
			</main>
			<footer>
				<span>zzhealth</span>
				<span>A small monitor. A useful signal.</span>
			</footer>
		</div>
	);
}
