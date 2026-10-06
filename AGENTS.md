<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-default-skills -->

# ELSHEKH RIDES — Project Default Skills

`.agent/` holds the project's default skill set (registered in Hermes as
`skills.external_dirs`, so they load from any working directory). Use them as
the default workflow for this project.

| Task | Skill |
| --- | --- |
| Plan/spec/audit a feature before coding | `saas-kit` |
| SaaS components, monetization, growth loops | `saas-product-growth` |
| Defensibility, pricing power, retention | `moat` |
| Frontend build + MDN standards audit | `mdn-web-best-practices` |
| Browser QA of the running app | `playwright-website-tester` |
| Visual design-to-code pages | `image-to-code` |
| Minimal, no-bloat implementation | `lean-code` |
| Brand/identity boards | `brandkit` |
| Deploy prep | `dublyo-deploy` |
| PocketBase on Dublyo | `dublyo-pocketbase` |
| Server-side tagging / pixels | `dublyo-tag-manager-server` |
| Dublyobase backend via MCP | `dublyobase-backend-builder` |

Default order for new work: `saas-kit` (spec + approval) →
`saas-product-growth` (SaaS completeness) → `lean-code` (implementation) →
`mdn-web-best-practices` (frontend) → `playwright-website-tester` (verify).

**Never write implementation code before the user approves the spec.**
Stay read-only on review/audit requests unless fixes are explicitly asked for.

The non-skill files at `.agent/` root (`saas-componenets.md`, `saas-marketing.md`,
`saas-mindmap.txt`, `markmap.html`, `remotion-llm.txt`) are source notes, not skills.

<!-- END:project-default-skills -->
