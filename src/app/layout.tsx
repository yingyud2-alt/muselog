import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Noto_Serif_SC,
} from "next/font/google";

import { LanguageProvider } from "@/components/i18n/language-provider";
import { NavigationWrapper } from "@/components/navigation/navigation-wrapper";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { metadataByLocale } from "@/lib/i18n";

import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

/** CJK fallback companion for Lora body text */
const notoSerifSc = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: metadataByLocale["zh-CN"].title,
  description: metadataByLocale["zh-CN"].description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${lora.variable} ${libreBaskerville.variable} ${jetbrainsMono.variable} ${notoSerifSc.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#090A0F] font-body">
        <LanguageProvider>
          <NavigationWrapper>{children}</NavigationWrapper>
          <MobileNavigation />
        </LanguageProvider>
      </body>
    </html>
  );
}
