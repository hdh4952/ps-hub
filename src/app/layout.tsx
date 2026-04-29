import "./globals.css";
import { Providers } from "./providers";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-neutral-50 text-neutral-900"><Providers>{children}</Providers></body></html>;
}
