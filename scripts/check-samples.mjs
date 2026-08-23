#!/usr/bin/env node
/**
 * Compile, run, and verify every TypeScript sample in these notes.
 *
 * These pages are almost entirely code plus claims ABOUT that code: every sample
 * ends in `console.log` calls with the expected result written underneath as a
 * comment. That makes the notes testable, and when this was first written they
 * did not pass. One sample did not compile at all, three printed values that
 * disagreed with the comments beside them, and all six used an output format no
 * runtime produces.
 *
 * For each ```ts block, this script:
 *   1. compiles it with the pinned TypeScript in devDependencies, under
 *      --strict, and fails on any diagnostic,
 *   2. runs the emitted JavaScript on the local node, and fails on a crash,
 *   3. compares the program's real stdout, line for line, against the expected
 *      output written in the block's comments.
 *
 * THE COMMENT CONVENTION, which step 3 depends on: an expected-output comment is
 * a run of lines starting `//` at COLUMN ZERO, placed directly under a
 * top-level statement that ends in `);`. Nothing else is read as an expectation,
 * so an ordinary explanatory comment needs either an indent or a blank line
 * between it and the statement above. Restricting it to column zero is what
 * keeps a comment inside a class body from being mistaken for program output.
 *
 * Comparison is on the whole transcript rather than per-call, which is what
 * catches an output NOBODY documented: an undocumented `console.log` shifts
 * every later line and the run fails, where a per-call check would skip it in
 * silence.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tsc = join(repo, 'node_modules', 'typescript', 'bin', 'tsc')

// Era-accurate, and pinned rather than floating. These notes were written in
// October 2022; --target es2022 is what makes the singleton's `#players`
// private field compile without a downlevel transform, which matters because
// the page is partly ABOUT that field being invisible to console.log.
const TSC_ARGS = ['--strict', '--target', 'es2022', '--module', 'commonjs']

const failures = []
const fail = (where, message, detail) => failures.push({ where, message, detail })

/** Character ranges covered by an HTML comment, so hidden code can be spotted. */
function commentRanges(text) {
  const ranges = []
  const re = /<!--[\s\S]*?-->/g
  let m
  while ((m = re.exec(text)) !== null) ranges.push([m.index, m.index + m[0].length])
  return ranges
}

/** Every fenced block, with its tag, 1-based opening-fence line, character
 *  offset (to test against HTML-comment ranges), and body. One pass. */
function blocks(text) {
  const lines = text.split('\n')
  const found = []
  let open = null
  let at = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = /^```(\S*)\s*$/.exec(line)
    if (fence) {
      if (open === null) open = { tag: fence[1], line: i + 1, at, body: [] }
      else {
        found.push({ ...open, source: open.body.join('\n') })
        open = null
      }
    } else if (open !== null) {
      open.body.push(line)
    }
    at += line.length + 1
  }
  // An unterminated fence would silently swallow the rest of the file, so say so
  // rather than checking a block that stops where the file happens to end.
  if (open !== null) fail('fence', `unterminated \`\`\` opened at line ${open.line}`)
  return found
}

/**
 * Expected-output runs in a block, per the convention in the header comment.
 * Returns [{ tsLine, expected: [line, ...] }] in source order.
 */
function expectations(source) {
  const lines = source.split('\n')
  const runs = []
  for (let i = 0; i < lines.length; i++) {
    // A top-level statement (column zero) whose last characters are `);`. That
    // is every output-producing call in these notes, and it excludes `super();`
    // and friends inside a class body by indentation alone.
    if (!/^\S.*\);\s*$/.test(lines[i])) continue
    const expected = []
    let j = i + 1
    while (j < lines.length && /^\/\/( |$)/.test(lines[j])) {
      expected.push(lines[j].replace(/^\/\/ ?/, '').replace(/\s+$/, ''))
      j++
    }
    if (expected.length > 0) runs.push({ tsLine: i + 1, expected })
    i = j - 1
  }
  return runs
}

const work = mkdtempSync(join(tmpdir(), 'design-patterns-samples-'))
let blockCount = 0
let compiled = 0
let ran = 0
let claims = 0
let bareFences = 0

const files = readdirSync(repo).filter((f) => f.endsWith('.md')).sort()

for (const file of files) {
  const text = readFileSync(join(repo, file), 'utf8')
  const hidden = commentRanges(text)
  const found = blocks(text)

  for (const b of found) {
    if (b.tag === '') {
      // Nothing in these notes needs an untagged fence, and an untagged block
      // holding code is code this script never compiles. Report the count so
      // the figure cannot go stale in prose.
      bareFences++
      if (/(^|\n)\s*(class |interface |type |enum |const |let |function )/.test(b.source)) {
        fail(`${file}:${b.line}`, 'untagged fence contains code, so nothing checks it')
      }
      continue
    }
    if (b.tag !== 'ts') {
      fail(`${file}:${b.line}`, `unexpected fence tag \`${b.tag}\`; these notes are TypeScript only`)
      continue
    }
    if (hidden.some(([from, to]) => b.at >= from && b.at <= to)) {
      // A sample inside <!-- --> renders nowhere and teaches nobody, and this
      // repository had one: a whole second singleton example, correct and
      // invisible.
      fail(`${file}:${b.line}`, 'ts block is inside an HTML comment, so readers never see it')
      continue
    }

    blockCount++
    const stem = `${file.replace(/\.md$/, '')}_L${b.line}`.replace(/[^\w.-]/g, '_')
    const tsPath = join(work, `${stem}.ts`)
    writeFileSync(tsPath, `${b.source}\n`)

    const outDir = join(work, stem)
    try {
      execFileSync(process.execPath, [tsc, ...TSC_ARGS, '--outDir', outDir, tsPath], {
        stdio: 'pipe',
        encoding: 'utf8',
      })
      compiled++
    } catch (err) {
      const diag = `${err.stdout ?? ''}${err.stderr ?? ''}`
        .split('\n')
        .filter(Boolean)
        // tsc reports against the temp copy, and by a path RELATIVE to the
        // working directory, so replacing the absolute path leaves a mangled
        // prefix behind. Match whatever path form ends in this block's stem.
        .map((l) => l.replace(new RegExp(`\\S*${stem}\\.ts`, 'g'), `${file} (block at line ${b.line})`))
        .join('\n')
      fail(`${file}:${b.line}`, 'does not compile', diag)
      continue
    }

    let stdout
    try {
      stdout = execFileSync(process.execPath, [join(outDir, `${stem}.js`)], {
        stdio: 'pipe',
        encoding: 'utf8',
      })
      ran++
    } catch (err) {
      fail(`${file}:${b.line}`, 'threw at runtime', `${err.stdout ?? ''}${err.stderr ?? ''}`)
      continue
    }

    const runs = expectations(b.source)
    const expected = []
    for (const run of runs) {
      for (const line of run.expected) expected.push({ text: line, tsLine: run.tsLine })
    }
    const actual = stdout.split('\n')
    while (actual.length > 0 && actual[actual.length - 1] === '') actual.pop()

    const limit = Math.max(expected.length, actual.length)
    for (let i = 0; i < limit; i++) {
      const want = expected[i]
      const got = actual[i]
      if (want !== undefined && got !== undefined && want.text === got.replace(/\s+$/, '')) {
        claims++
        continue
      }
      const at = want ? b.line + want.tsLine : b.line
      fail(
        `${file}:${at}`,
        want === undefined
          ? 'output with no documented expectation'
          : got === undefined
            ? 'documented output the program never produced'
            : 'documented output does not match what the program prints',
        `expected: ${want === undefined ? '(nothing)' : JSON.stringify(want.text)}\n` +
          `actual:   ${got === undefined ? '(nothing)' : JSON.stringify(got.replace(/\s+$/, ''))}`,
      )
      break
    }
  }
}

rmSync(work, { recursive: true, force: true })

console.log(
  `${files.length} notes files: ${blockCount} ts block(s), ${compiled} compiled, ` +
    `${ran} ran, ${claims} output claim(s) matched`,
)
console.log(`  untagged fences: ${bareFences}`)

if (failures.length === 0) {
  console.log('no failures')
  process.exit(0)
}

console.error(`\n${failures.length} failure(s):`)
for (const f of failures) {
  console.error(`\n  ${f.where}: ${f.message}`)
  if (f.detail) console.error(f.detail.replace(/^/gm, '    '))
}
process.exit(1)
