import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { PageTransition } from "@/components/shared/page-transition";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
