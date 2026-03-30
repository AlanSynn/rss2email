import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getEmailOutputPath, replaceEmailOutput } from './emailOutput'

describe('replaceEmailOutput', () => {
  const tempDirs: string[] = []

  afterEach(() => {
    tempDirs.splice(0).forEach((tempDir) => {
      rmSync(tempDir, { recursive: true, force: true })
    })
  })

  it('removes a stale output file when skipping email generation', () => {
    const outputDir = mkdtempSync(path.join(os.tmpdir(), 'rss-to-email-'))
    const outputFile = getEmailOutputPath(outputDir)

    tempDirs.push(outputDir)
    writeFileSync(outputFile, 'stale')

    replaceEmailOutput({ outputDir })

    expect(existsSync(outputFile)).toBe(false)
  })

  it('writes the current html output when email generation succeeds', () => {
    const outputDir = mkdtempSync(path.join(os.tmpdir(), 'rss-to-email-'))
    const outputFile = getEmailOutputPath(outputDir)

    tempDirs.push(outputDir)
    replaceEmailOutput({ outputDir, html: '<h1>fresh</h1>' })

    expect(readFileSync(outputFile, 'utf-8')).toBe('<h1>fresh</h1>')
  })
})
