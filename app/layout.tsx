import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulsePass | Event Marketplace",
  description: "Discover and secure seats to the premier events around you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 tracking-tight">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-between p-1.5 shadow-sm shadow-indigo-200">
                <div className="w-full h-full bg-white rounded-[3px] scale-x-[0.35] rotate-12"></div>
              </div>
              <a href="/" className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent decoration-none">
                PulsePass
              </a>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              Live Hub
            </span>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}