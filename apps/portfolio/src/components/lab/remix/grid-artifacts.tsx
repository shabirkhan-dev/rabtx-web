"use client";

import { FileLibrary } from "@/components/lab/file-library/file-library";
import type { Library } from "@/components/lab/file-library/data";

/*
 * My take on the File library: what a Grid project leaves behind. People and AI agents both add
 * files (the agents' faces in their own colours), and the folders are what a project sorts its
 * work into: specs, diffs, run logs, releases. It only takes the library prop I added: the
 * component is the same one as above.
 */

const GRID: Library = {
  workspace: "Grid · rabtx-web",
  people: {
    sk: { id: "sk", name: "Shabir Khan", initials: "SK", color: "#f6d47e" },
    builder: { id: "builder", name: "Builder agent", initials: "BA", color: "#9fc3ff" },
    reviewer: { id: "reviewer", name: "Reviewer agent", initials: "RA", color: "#b9e6c6" },
    ci: { id: "ci", name: "Night CI", initials: "CI", color: "#d6c3f7" },
    you: { id: "you", name: "You", initials: "YO" },
  },
  members: ["sk", "builder", "reviewer"],
  folders: [
    {
      id: "specs",
      name: "Specs",
      count: 9,
      members: ["sk", "builder"],
      papers: [
        { id: "sp-1", kind: "doc" },
        { id: "sp-2", kind: "doc" },
        { id: "sp-3", kind: "pdf" },
      ],
    },
    {
      id: "diffs",
      name: "PR diffs",
      count: 21,
      members: ["builder", "reviewer"],
      papers: [
        { id: "df-1", kind: "sheet" },
        { id: "df-2", kind: "doc" },
      ],
    },
    {
      id: "runs",
      name: "Agent runs",
      count: 0,
      members: [],
      private: true,
      papers: [],
    },
    {
      id: "releases",
      name: "Releases",
      count: 4,
      members: ["sk", "ci"],
      papers: [
        { id: "rl-1", kind: "image", hues: [200, 250] },
        { id: "rl-2", kind: "slides" },
      ],
    },
  ],
  files: [
    { id: "g1", name: "run-2026-11-05-auth-refresh.log", kind: "doc", owner: "builder", size: "86 KB" },
    { id: "g2", name: "review-pr-214.md", kind: "doc", owner: "reviewer", size: "12 KB" },
    { id: "g3", name: "board-columns-spec.pdf", kind: "pdf", owner: "sk", size: "640 KB" },
    { id: "g4", name: "e2e-suite-results.csv", kind: "sheet", owner: "ci", size: "1.4 MB" },
    { id: "g5", name: "release-notes-0.9.pptx", kind: "slides", owner: "sk", size: "3.2 MB" },
    { id: "g6", name: "agent-picker-screens.png", kind: "image", owner: "sk", size: "2.1 MB" },
    { id: "g7", name: "flaky-sync-trace.log", kind: "doc", owner: "ci", size: "240 KB" },
  ],
  others: ["Design reviews", "Incidents"],
  shared: [{ name: "Client handoff", count: 3 }],
};

export function GridArtifacts() {
  return <FileLibrary library={GRID} autoplay={false} />;
}
