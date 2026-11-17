import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy and AI · ensaio",
  description: "What ensaio does with your voice, your transcripts and your consents.",
};

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
