import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const EMAIL_FILE_NAME = 'email.html'

export const getEmailOutputPath = (outputDir: string) => path.join(outputDir, EMAIL_FILE_NAME)

interface ReplaceEmailOutputProps {
  outputDir: string
  html?: string
}

export const replaceEmailOutput = ({ outputDir, html }: ReplaceEmailOutputProps) => {
  const outputPath = getEmailOutputPath(outputDir)

  if (existsSync(outputPath)) {
    rmSync(outputPath)
  }

  if (typeof html === 'undefined') {
    return outputPath
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  writeFileSync(outputPath, html, { flag: 'w' })

  return outputPath
}
