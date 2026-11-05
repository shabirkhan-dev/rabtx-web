// Copyright (c) 2026 Bruno Delorence. MIT License.
// Changed for rabtx: faces take a Person (with its own colour, if it has one), and the picture
// takes the library's people, so any library can draw its members.

import type { CSSProperties } from 'react';
import type { Folder, Person, PersonId } from './data';
import { Icon } from './icons';
import styles from './file-library.module.css';

/*
 * A folder tile's picture, 134 × 104 px: the folder's back with its tab, up to three papers
 * peeking out of it, and a frosted front panel over their lower half. The papers are the
 * folder's last three files, the newest in front, so the cover changes as files go in: a white
 * page with its type's coloured square for a document, a gradient card for a picture. The front
 * carries the members, a Private chip, or an upload's progress and its check.
 *
 * Everything that moves is CSS on the tile's data attributes (file-library.module.css): over a
 * drag, the front tips forward on its bottom edge and the papers rise; a new paper drops in.
 */

/** A person to draw for an id the library doesn't know: their id as initials. */
export const unknownPerson = (id: PersonId): Person => ({
  id,
  name: id,
  initials: id.slice(0, 2).toUpperCase(),
});

/** The small round face used across the library: initials on a pastel. */
export function Avatar({ person, className }: { person: Person; className?: string }) {
  return (
    <span
      className={`${styles.avatar} ${className ?? ''}`}
      data-person={person.id}
      style={person.color ? { background: person.color } : undefined}
      aria-hidden="true"
    >
      {person.initials}
    </span>
  );
}

/** How the papers fan out, by depth (0 is the cover): x and y in px, then the turn in degrees. */
const FAN: [number, number, number][] = [
  [5, 3, 0.5],
  [-7, 0, -5],
  [12, -2, 4.5],
];

export function FolderArt({
  folder,
  people,
  fresh,
  progress,
  done,
}: {
  folder: Folder;
  /** The library's people, for the members' faces. */
  people: Record<PersonId, Person>;
  /** Papers that just went in: they drop into place. */
  fresh: ReadonlySet<string>;
  /** An upload into this folder, 0 to 100, or null. */
  progress: number | null;
  /** An upload just finished here: the check shows. */
  done: boolean;
}) {
  const shown = folder.papers.slice(-3);
  return (
    <span className={styles.art} data-part="folder-art" aria-hidden="true">
      <svg className={styles.back} viewBox="0 0 134 104" preserveAspectRatio="none">
        {/* The back, with its tab on the left: one path so the tab's shoulder curves into it. */}
        <path d="M0 10a10 10 0 0 1 10-10h26c3.4 0 5.6 1.2 7.6 3.4L47 7.2c1.6 1.8 3.4 2.6 5.8 2.6H124a10 10 0 0 1 10 10V94a10 10 0 0 1-10 10H10A10 10 0 0 1 0 94Z" />
      </svg>
      <span className={styles.papers}>
        {shown.map((paper, index) => (
          <span
            key={paper.id}
            className={styles.paper}
            data-kind={paper.kind}
            data-fresh={fresh.has(paper.id) || undefined}
            style={
              {
                '--x': `${FAN[shown.length - 1 - index][0]}px`,
                '--y': `${FAN[shown.length - 1 - index][1]}px`,
                '--r': `${FAN[shown.length - 1 - index][2]}deg`,
                '--h1': paper.hues?.[0],
                '--h2': paper.hues?.[1],
              } as CSSProperties
            }
          >
            {paper.kind !== 'image' && (
              <>
                <i className={styles.paperSquare} />
                <i className={styles.paperLine} />
                <i className={styles.paperLine} />
              </>
            )}
          </span>
        ))}
      </span>
      <span className={styles.front} data-part="folder-front">
        {progress !== null ? (
          <span className={styles.progress}>
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </span>
        ) : folder.private ? (
          <span className={styles.privateChip}>
            <Icon name="lock" width="10" height="10" />
            Private
          </span>
        ) : (
          <span className={styles.members}>
            {folder.members.map((id) => (
              <Avatar
                key={id}
                person={people[id] ?? unknownPerson(id)}
                className={styles.memberAvatar}
              />
            ))}
          </span>
        )}
        <span className={styles.doneBadge} data-shown={done || undefined}>
          <Icon name="check" width="10" height="10" strokeWidth="2" />
        </span>
      </span>
    </span>
  );
}
