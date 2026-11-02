/** The single 550px column every page sits in, from the Figma frames. */
export function PageColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <main className="mx-auto flex w-full max-w-[590px] flex-col px-5 pt-10 pb-10 md:pt-[88px] md:pb-16">
        {children}
      </main>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-hand text-[36px] leading-10 font-normal text-foreground">
      {children}
    </h2>
  );
}
