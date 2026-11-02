import Link from "next/link";
import { Undo2 } from "lucide-react";
import { PageColumn } from "@/components/page-column";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <PageColumn>
      <div className="flex flex-col gap-3.5 pb-24">
        <h1 className="text-[28px] leading-8 font-semibold tracking-[-0.03em] text-foreground">
          Page not found
        </h1>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm leading-5 text-muted transition-colors hover-capable:hover:text-foreground"
        >
          <Undo2 className="size-4" strokeWidth={1.5} />
          Home
        </Link>
      </div>
      <SiteFooter />
    </PageColumn>
  );
}
