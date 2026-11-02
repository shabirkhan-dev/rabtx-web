import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { links, profile, projects, skills, work } from "@/data/profile";
import { getPosts } from "@/data/posts";
import { Highlights } from "@/components/highlights";
import { PageColumn, SectionTitle } from "@/components/page-column";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { iconButton, iconButtonRaised } from "@/lib/icon-button";

const strong = "font-medium text-foreground";
const underlined = `${strong} underline decoration-from-font underline-offset-2`;

function Intro() {
  return (
    <header className="flex flex-col gap-7">
      <div className="flex items-center gap-3.5">
        <Image
          src="/avatar.png"
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
        <p>
          Based in <span className={strong}>Islamabad</span>, building web and mobile products end
          to end, from the interface and the API to the pipeline that ships them
        </p>
        <p>
          Right now I am leading the frontend of <span className={strong}>Auspira</span> at{" "}
          <span className={strong}>Nexora AI</span>, and building{" "}
          <a href={projects[0].live} className={underlined}>
            Grid
          </a>
          , an open-source workspace where people and AI coding agents work on the same project, now
          in public beta
        </p>
        <p>
          The last eight years have moved between freelance work, an AI startup, and leading
          frontend teams, most recently on the rebuild of an HR platform used by PepsiCo and Intel
        </p>
        <p>
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

const iconLink = `relative z-10 ${iconButtonRaised}`;

function Projects() {
  return (
    <section className="flex flex-col gap-1">
      <SectionTitle>Projects</SectionTitle>
      <div className="h-3" />
      {projects.map((project) => (
        <div
          key={project.name}
          className="group relative flex items-center gap-4 rounded-xl px-2.5 py-3 transition-colors hover-capable:hover:bg-surface"
        >
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <a
                href={project.live ?? project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm leading-5 font-medium tracking-[-0.0064em] text-foreground after:absolute after:inset-0 after:rounded-xl"
              >
                {project.name}
              </a>
              {project.isNew ? (
                <span className="rounded-full border border-new px-[7px] pb-px font-hand text-[15px] leading-4 text-new">
                  New
                </span>
              ) : null}
            </div>
            <p className="max-w-[430px] text-sm leading-5 tracking-[-0.0064em] text-muted">
              {project.description}
            </p>
          </div>
          <div className="flex items-center gap-2 transition-opacity hover-capable:opacity-0 hover-capable:group-hover:opacity-100 hover-capable:group-focus-within:opacity-100">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} on GitHub`}
              className={iconLink}
            >
              <Github className="size-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      ))}
    </section>
  );
}

async function Writing() {
  const posts = await getPosts();
  return (
    <section id="writing" className="flex scroll-mt-10 flex-col">
      <SectionTitle>Writing</SectionTitle>
      <div className="h-4" />
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="group flex items-center gap-4 border-t border-line py-4 last:border-b"
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
        </Link>
      ))}
    </section>
  );
}

const mono = "font-mono text-[11px] leading-4";

function Work() {
  return (
    <section className="flex flex-col">
      <SectionTitle>Work</SectionTitle>
      <div className="h-5" />
      <ol>
        {work.map((job, i) => {
          const current = job.to === "Now";
          const last = i === work.length - 1;
          return (
            <li key={job.company} className="flex gap-3.5 md:gap-4">
              <p className={`hidden w-14 shrink-0 pt-0.5 md:block ${mono} text-muted`}>
                {job.from}
                <br />
                <span className={current ? "text-new" : "text-faint"}>{job.to}</span>
              </p>
              <div className="flex w-[9px] shrink-0 flex-col items-center pt-[5px]" aria-hidden="true">
                <span
                  className={`size-[9px] shrink-0 rounded-full ${
                    current
                      ? "bg-new shadow-[0_0_0_4px_color-mix(in_oklab,var(--new)_25%,transparent)]"
                      : "border-[1.5px] border-faint bg-background"
                  }`}
                />
                {last ? null : <span className="w-px flex-1 bg-line" />}
              </div>
              <div className={`flex flex-1 flex-col gap-1 text-sm leading-5 tracking-[-0.0064em] ${last ? "" : "pb-7"}`}>
                <div className="flex items-baseline gap-2">
                  <p className="flex-1 font-medium text-foreground">{job.company}</p>
                  <p className={`md:hidden ${mono} ${current ? "text-new" : "text-faint"}`}>
                    {job.from}—{job.to}
                  </p>
                </div>
                <p className="text-muted">{job.role}</p>
                <p className="mt-0.5 text-muted">{job.summary}</p>
                <p className={`mt-0.5 ${mono} text-faint`}>{job.stack.join(" · ")}</p>
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
    <section className="flex flex-col">
      <SectionTitle>Skills</SectionTitle>
      <div className="h-4" />
      <dl>
        {skills.map(([area, list]) => (
          <div
            key={area}
            className="flex flex-col gap-1 border-t border-line py-3.5 text-sm leading-5 tracking-[-0.0064em] last:border-b md:flex-row md:gap-4"
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
        <Projects />
        <Writing />
        <Work />
        <Skills />
        <SiteFooter />
      </div>
    </PageColumn>
  );
}
