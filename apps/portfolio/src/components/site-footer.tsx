import { FileText, Github, Linkedin, Mail } from "lucide-react";
import { links, profile } from "@/data/profile";
import { SectionTitle } from "@/components/page-column";
import { iconButton } from "@/lib/icon-button";

const social = [
  { label: "GitHub", href: links.github, Icon: Github },
  { label: "LinkedIn", href: links.linkedin, Icon: Linkedin },
  { label: "Email", href: links.email, Icon: Mail },
  { label: "CV (PDF)", href: links.cv, Icon: FileText },
];

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-9 border-t border-line pt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <div className="flex flex-1 flex-col gap-3">
          <SectionTitle>Elsewhere</SectionTitle>
          <p className="max-w-[300px] text-sm leading-6 tracking-[-0.0064em] text-muted">
            {profile.availability}
          </p>
        </div>
        <ul className="flex items-center gap-2">
          {social.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={label}
                {...(href.startsWith("mailto:")
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className={iconButton}
              >
                <Icon className="size-4" strokeWidth={1.5} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-4 text-[11px] leading-4 tracking-[-0.0064em] text-muted">
        <p className="flex-1">© {new Date().getFullYear()} {profile.name}</p>
        <p>{profile.location}</p>
      </div>
    </footer>
  );
}
