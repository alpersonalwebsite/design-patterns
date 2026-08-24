#!/usr/bin/env node
/**
 * Check every markdown link in these notes.
 *
 * All the links here are relative, one page to another, and the repository
 * shipped with a broken one: 00_1_5_0-prototype.md pointed at
 * 00_1_5_1-prototype-shallow-vs-deep-copy.md, which had never been committed. A
 * dead relative link is a silent failure, because the only way to find it by
 * reading is to click it, and nobody clicks every link on a page they wrote.
 *
 * Two things are checked, and one is deliberately NOT.
 *
 *   Checked: every link target resolves to a file that exists.
 *   Checked: every heading anchor named in a link exists in the target file,
 *            using GitHub's slug rules.
 *   Not checked: external URLs. There are none in these notes, and this reports
 *            the count so that stays visible. If one is added, a link to the
 *            outside world rots as a function of elapsed TIME rather than of
 *            commits, so a check that only runs on push would be looking on the
 *            one day the link still worked. That wants a scheduled job, not this
 *            script.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const files = readdirSync(repo).filter((f) => f.endsWith('.md')).sort()

/**
 * GitHub's heading slug: lowercase, drop anything that is not a word character,
 * a space or a hyphen, then spaces to hyphens. Trimmed ONCE up front, because
 * trimming after the substitutions produces a different answer for a heading
 * that ends in punctuation.
 */
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-')

const headings = new Map()
for (const file of files) {
  const found = new Set()
  let inFence = false
  for (const line of readFileSync(join(repo, file), 'utf8').split('\n')) {
    if (/^```/.test(line)) {
      inFence = !inFence
      continue
    }
    // A `#` inside a fence is a comment or a private field, not a heading.
    if (inFence) continue
    const m = /^#{1,6}\s+(.*?)\s*$/.exec(line)
    if (m) found.add(slug(m[1]))
  }
  headings.set(file, found)
}

const failures = []
let relative = 0
let external = 0
let anchors = 0

for (const file of files) {
  const text = readFileSync(join(repo, file), 'utf8')
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1]
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
      external++
      continue
    }
    const [path, anchor] = target.split('#')
    const inFile = path === '' ? file : path.replace(/^\.\//, '')

    if (path !== '') {
      relative++
      if (!existsSync(join(repo, inFile))) {
        failures.push(`${file}: link to \`${target}\`, but ${inFile} does not exist`)
        continue
      }
    }
    if (anchor) {
      anchors++
      const known = headings.get(inFile)
      if (!known) {
        failures.push(`${file}: anchor \`#${anchor}\` in a file this script did not read (${inFile})`)
      } else if (!known.has(anchor)) {
        failures.push(`${file}: link to \`${target}\`, but ${inFile} has no heading slugging to \`${anchor}\``)
      }
    }
  }
}

console.log(
  `${files.length} notes files: ${relative} relative link(s), ${anchors} anchor(s), ` +
    `${external} external URL(s) not checked`,
)

if (failures.length === 0) {
  console.log('all links resolve')
  process.exit(0)
}

console.error(`\n${failures.length} broken link(s):`)
for (const f of failures) console.error(`  ${f}`)
process.exit(1)
