import type { Metadata } from "next";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { LabList } from "@/components/lab/lab-list";
import { PageColumn, SectionTitle } from "@/components/page-column";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Lab",
  description: "Experiments: interface studies, rendering tricks and components built to learn something.",
  alternates: { canonical: "/lab" },
};

export default function LabPage() {
  return (
    <PageColumn>
      <div className="flex flex-col gap-16 md:gap-[88px]">
        <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm leading-5 text-muted transition-colors hover-capable:hover:text-foreground"
            >
              <Undo2 className="size-4" strokeWidth={1.5} />
              Home
            </Link>
            <ThemeToggle />
          </div>
          <SectionTitle>Lab</SectionTitle>
          <p className="max-w-[440px] text-sm leading-5 tracking-[-0.0064em] text-muted">
            Small experiments, kept apart from client work: interface studies, rendering tricks and
            components I build or take apart to learn how they work. Each one runs live in the page.
          </p>
        </header>
        <LabList />
        </div>
        <SiteFooter />
      </div>
    </PageColumn>
  );
}
