import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "zzhealth | Service health",
	description: "A small, clear view of your HTTP services.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
