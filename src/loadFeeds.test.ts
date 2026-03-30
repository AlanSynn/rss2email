import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadFeeds } from './loadFeeds'

describe('loadFeeds', () => {
  const originalCwd = process.cwd()
  const tempDirs: string[] = []

  afterEach(() => {
    process.chdir(originalCwd)

    tempDirs.splice(0).forEach((tempDir) => {
      rmSync(tempDir, { recursive: true, force: true })
    })
  })

  it('loads feeds from the repository root file and ignores blank lines and comments', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'rss-feeds-'))

    tempDirs.push(tempDir)
    writeFileSync(
      path.join(tempDir, 'feeds.txt'),
      ['# Main feeds', '', 'https://lisyarus.github.io/blog/feed.xml', '  https://example.com/feed.xml  '].join('\n'),
    )

    process.chdir(tempDir)

    expect(loadFeeds()).toEqual(['https://lisyarus.github.io/blog/feed.xml', 'https://example.com/feed.xml'])
  })

  it('fails fast when the root feed list is empty', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'rss-feeds-'))

    tempDirs.push(tempDir)
    writeFileSync(path.join(tempDir, 'feeds.txt'), '\n# no feeds configured yet\n')

    process.chdir(tempDir)

    expect(() => loadFeeds()).toThrow('No feeds configured in feeds.txt')
  })
})
