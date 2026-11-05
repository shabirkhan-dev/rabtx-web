// Copyright (c) 2026 Bruno Delorence. MIT License.

import type { ReactNode, SVGProps } from 'react';

/*
 * The library's icons, drawn for it on a 16-unit grid with a 1.4 stroke in currentColor. All of
 * them are decorative: the control around each one carries its name.
 */

export type IconName =
  | 'mark'
  | 'home'
  | 'folder'
  | 'folderOpen'
  | 'clock'
  | 'people'
  | 'trash'
  | 'plus'
  | 'panel'
  | 'search'
  | 'chevron'
  | 'updown'
  | 'link'
  | 'upload'
  | 'check'
  | 'close'
  | 'move'
  | 'lock'
  | 'file';

const PATHS: Record<IconName, ReactNode> = {
  // The workspace's mark: a ring with a bite out of it.
  mark: (
    <path
      d="M11.6 4.6A5 5 0 1 0 11.6 11.4 3.6 3.6 0 1 1 11.6 4.6Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  home: <path d="M2.8 7.2 8 3l5.2 4.2V13a.8.8 0 0 1-.8.8H9.6V10H6.4v3.8H3.6a.8.8 0 0 1-.8-.8Z" />,
  folder: (
    <path d="M2.2 4.6c0-.6.5-1.1 1.1-1.1h2.9l1.4 1.5h5.1c.6 0 1.1.5 1.1 1.1v5.8c0 .6-.5 1.1-1.1 1.1H3.3c-.6 0-1.1-.5-1.1-1.1Z" />
  ),
  folderOpen: (
    <>
      <path d="M2.2 11.4V4.6c0-.6.5-1.1 1.1-1.1h2.9l1.4 1.5h4.5c.6 0 1.1.5 1.1 1.1v1.1" />
      <path d="M2.2 11.4 3.9 7.8c.2-.4.6-.6 1-.6h8.5c.5 0 .8.5.6.9l-1.6 3.6c-.2.4-.6.7-1 .7H3.3c-.6 0-1.1-.5-1.1-1Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M8 5v3.2l2.1 1.3" />
    </>
  ),
  people: (
    <>
      <circle cx="6.2" cy="5.6" r="2.3" />
      <path d="M2.2 13c.4-2.2 2-3.4 4-3.4s3.6 1.2 4 3.4" />
      <path d="M10.4 3.6a2.2 2.2 0 0 1 0 4.1M11.8 9.9c1 .5 1.7 1.6 2 3.1" />
    </>
  ),
  trash: (
    <>
      <path d="M2.8 4.4h10.4M6.4 4.4V3c0-.3.3-.6.6-.6h2c.3 0 .6.3.6.6v1.4" />
      <path d="M4 4.4l.6 8.4c0 .5.5.9 1 .9h4.8c.5 0 1-.4 1-.9l.6-8.4M6.8 7v4.2M9.2 7v4.2" />
    </>
  ),
  plus: <path d="M8 3.2v9.6M3.2 8h9.6" />,
  panel: (
    <>
      <rect x="2.4" y="2.8" width="11.2" height="10.4" rx="1.8" />
      <path d="M6.2 2.8v10.4" />
    </>
  ),
  search: (
    <>
      <circle cx="7.2" cy="7.2" r="4.2" />
      <path d="m10.4 10.4 3 3" />
    </>
  ),
  chevron: <path d="m4.8 6.4 3.2 3.2 3.2-3.2" />,
  updown: <path d="m5.4 6 2.6-2.6L10.6 6M5.4 10 8 12.6l2.6-2.6" />,
  link: (
    <>
      <path d="M6.9 9.1a2.6 2.6 0 0 0 3.7 0l2-2a2.6 2.6 0 0 0-3.7-3.7l-.7.7" />
      <path d="M9.1 6.9a2.6 2.6 0 0 0-3.7 0l-2 2a2.6 2.6 0 0 0 3.7 3.7l.7-.7" />
    </>
  ),
  upload: (
    <>
      <path d="M8 10.4V3M5 5.8 8 2.8l3 3" />
      <path d="M2.8 10.2v1.9c0 .6.5 1.1 1.1 1.1h8.2c.6 0 1.1-.5 1.1-1.1v-1.9" />
    </>
  ),
  check: <path d="m3.8 8.3 2.7 2.7 5.7-6" />,
  close: <path d="m4.4 4.4 7.2 7.2M11.6 4.4l-7.2 7.2" />,
  // A folder with an arrow going in: Move to.
  move: (
    <>
      <path d="M2.2 7.4V4.6c0-.6.5-1.1 1.1-1.1h2.9l1.4 1.5h5.1c.6 0 1.1.5 1.1 1.1v5.8c0 .6-.5 1.1-1.1 1.1H8.6" />
      <path d="M2 10.4h4.6M5 8.6l1.8 1.8L5 12.2" />
    </>
  ),
  lock: (
    <>
      <rect x="3.6" y="7" width="8.8" height="6.4" rx="1.4" />
      <path d="M5.6 7V5.4a2.4 2.4 0 0 1 4.8 0V7" />
    </>
  ),
  file: (
    <>
      <path d="M4 2.6h5l3 3v7.2c0 .4-.3.6-.6.6H4.6c-.4 0-.6-.2-.6-.6Z" />
      <path d="M9 2.6v3h3" />
    </>
  ),
};

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
