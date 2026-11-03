import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { highlights, links, profile, skills, work } from "@/data/profile";
import { getPosts } from "@/data/posts";
import { BottomBar } from "@/components/bottom-bar";
import { EdgeFade } from "@/components/edge-fade";
import { Highlights } from "@/components/highlights";
import { PageColumn, SectionTitle } from "@/components/page-column";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { iconButton } from "@/lib/icon-button";

const strong = "font-medium text-foreground";
const underlined = `${strong} underline decoration-from-font underline-offset-2`;

/** A highlighter stroke over a key phrase; it swipes across once on load (`.marker` in globals.css). */
function Mark({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <mark className={`marker ${strong}`} style={{ "--delay": `${delay}s` } as React.CSSProperties}>
      {children}
    </mark>
  );
}

function Intro() {
  return (
    <header className="flex flex-col gap-7">
      <div className="flex items-center gap-3.5">
        <Image
          src="/avatar.webp"
          alt={profile.name}
          width={56}
          height={56}
          priority
          className="size-14 rounded-[10px] object-cover"
        />
        <div className="flex-1 text-sm leading-5 tracking-[-0.0064em]">
          <h1 className="font-medium text-foreground">{profile.name}</h1>
          <p className="text-muted">{profile.role}</p>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-4 text-sm leading-5 tracking-[-0.0064em] text-muted">
        <p className="focus-in" style={{ "--delay": "0.15s" } as React.CSSProperties}>
          Based in <span className={strong}>Islamabad</span>, building web and mobile products{" "}
          <Mark delay={0.9}>end to end</Mark>, from the interface and the API to the pipeline that
          ships them
        </p>
        <p className="focus-in" style={{ "--delay": "0.33s" } as React.CSSProperties}>
          Right now I am leading the frontend of <span className={strong}>Auspira</span> at{" "}
          <span className={strong}>Nexora AI</span>, and building{" "}
          <a href={highlights[0].live}>
            <Mark delay={1.2}>Grid</Mark>
          </a>
          , an open-source workspace where people and AI coding agents work on the same project, now
          in public beta
        </p>
        <p className="focus-in" style={{ "--delay": "0.51s" } as React.CSSProperties}>
          The last eight years have moved between freelance work, an AI startup, and leading
          frontend teams, most recently on the rebuild of an HR platform used by{" "}
          <Mark delay={1.5}>PepsiCo and Intel</Mark>
        </p>
        <p className="focus-in" style={{ "--delay": "0.69s" } as React.CSSProperties}>
          I share my work on{" "}
          <a href={links.github} className={underlined}>
            GitHub
          </a>
          , my{" "}
          <a href={links.cv} target="_blank" rel="noopener" className={underlined}>
            CV
          </a>{" "}
          is a PDF, and I can be reached by{" "}
          <a href={links.email} className={underlined}>
            email
          </a>
        </p>
      </div>
    </header>
  );
}

async function Writing() {
  const posts = await getPosts();
  if (posts.length === 0) return null;
  return (
    <section id="writing" className="flex scroll-mt-16 flex-col">
      <SectionTitle>Writing</SectionTitle>
      <div className="h-4" />
      {posts.map((post) => (
        <a
          key={post.slug}
          href={post.url}
          className="reveal group flex items-center gap-4 border-t border-line py-4 last:border-b"
        >
          {post.thumbnail ? (
            <Image
              src={post.thumbnail}
              alt={`Cover image for ${post.title}`}
              width={80}
              height={64}
              sizes="80px"
              className="h-16 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="h-16 w-20 shrink-0 rounded-lg bg-linear-to-r from-raised to-chip" />
          )}
          <div className="flex flex-1 flex-col gap-1 text-sm leading-5 tracking-[-0.0064em]">
            <p className="font-medium text-foreground">{post.title}</p>
            <p className="max-w-[400px] text-muted">{post.excerpt}</p>
          </div>
          <span
            className={`${iconButton} group-hover:bg-raised group-hover:text-foreground`}
            aria-hidden="true"
          >
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </span>
        </a>
      ))}
    </section>
  );
}

function Work() {
  return (
    <section id="work" className="flex scroll-mt-16 flex-col">
      <SectionTitle>Work</SectionTitle>
      <div className="h-6" />
      <ol className="flex flex-col">
        {work.map((job, i) => {
          const current = job.to === "Now";
          const last = i === work.length - 1;
          return (
            <li
              key={job.company}
              className="reveal relative grid grid-cols-[20px_1fr] gap-x-3 pb-8 text-sm leading-5 tracking-[-0.0064em] last:pb-0"
            >
              {/* The rail: one dot per role, joined by a dotted trail down to the next. */}
              {last ? null : (
                <span className="absolute top-4 -bottom-1 left-[9px] w-[2px] bg-[radial-gradient(circle,var(--faint)_0.8px,transparent_1.1px)] bg-size-[2px_6px] bg-repeat-y opacity-55" aria-hidden="true" />
              )}
              <span
                className={`relative mt-1.5 size-2 justify-self-center rounded-full ${
                  current ? "bg-new ring-4 ring-new/15" : "border border-faint bg-background"
                }`}
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-foreground">{job.company}</span>
                    {job.type ? (
                      <span className="rounded-full border border-line px-2 text-[11px] leading-[18px] text-muted">
                        {job.type}
                      </span>
                    ) : null}
                  </p>
                  <p className="shrink-0 font-mono text-[11px] leading-5 whitespace-nowrap text-faint">
                    {job.from} — {current ? <span className="text-new">Now</span> : job.to}
                  </p>
                </div>
                <p className="text-muted">{job.role}</p>
                <p className="mt-2 max-w-[440px] text-faint">{job.summary}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Skills() {
  return (
    <section id="skills" className="flex scroll-mt-16 flex-col">
      <SectionTitle>Skills</SectionTitle>
      <div className="h-4" />
      <dl>
        {skills.map(([area, list]) => (
          <div
            key={area}
            className="reveal flex flex-col gap-1 border-t border-line py-3.5 text-sm leading-5 tracking-[-0.0064em] last:border-b md:flex-row md:gap-4"
          >
            <dt className="font-medium text-foreground md:w-[140px] md:shrink-0">{area}</dt>
            <dd className="text-muted">{list}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function Home() {
  return (
    <PageColumn>
      <div className="flex flex-col gap-16 md:gap-[88px]">
        <Intro />
        <Highlights />
        <Work />
        <Skills />
        <Writing />
        <SiteFooter />
      </div>
      <EdgeFade />
      <BottomBar />
    </PageColumn>
  );
}
