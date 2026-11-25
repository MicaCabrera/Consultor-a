import { DM_Sans } from "next/font/google";

export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  // Only the weights the site uses (400 text, 500 titles, 600 labels).
  weight: ["400", "500", "600"],
  display: "swap",
});
