import { createServer as createViteServer } from 'vite'

const outputDir = './dist'

const getFromArgv = (key) => process.argv.find((arg) => arg.startsWith(`${key}=`))?.replaceAll(`${key}=`, '')

const parseFailureMessage = (decision) => {
  switch (decision.reason) {
    case 'all-feeds-failed':
      return 'All feeds failed to load, skipping email and failing the run'
    case 'invalid-last-success':
      return 'The lastSuccess input could not be parsed, failing the run'
  }
}

async function createEmail() {
  const vite = await createViteServer({
    appType: 'custom',
  })

  const actionUrl = getFromArgv('actionUrl')
  const lastSuccess = getFromArgv('lastSuccess')
  let exitCode = 0

  try {
    const [{ evaluateDispatch }, { buildEmailHtml }, { replaceEmailOutput }] = await Promise.all([
      vite.ssrLoadModule('/src/evaluateDispatch.ts'),
      vite.ssrLoadModule('/src/renderEmail.tsx'),
      vite.ssrLoadModule('/src/emailOutput.ts'),
    ])

    const decision = await evaluateDispatch({ lastSuccess })

    switch (decision.kind) {
      case 'send': {
        const html = await buildEmailHtml({
          actionUrl,
          feeds: decision.filteredFeeds,
          from: decision.from,
          initialRun: decision.initialRun,
          itemCount: decision.itemCount,
        })

        replaceEmailOutput({ outputDir, html })
        console.log(`Created email with ${decision.itemCount} new items`)
        return
      }
      case 'skip':
        replaceEmailOutput({ outputDir })
        console.log(
          decision.reason === 'no-new-items'
            ? 'No new items in feed, skipping email'
            : 'No new items in feed, skipping email despite partial feed fetch failures',
        )
        return
      case 'fail':
        replaceEmailOutput({ outputDir })
        exitCode = 1
        console.error(parseFailureMessage(decision))

        if (decision.error) {
          console.error(decision.error)
        }

        return
    }
  } catch (e) {
    exitCode = 1
    console.error(e)
  } finally {
    await vite.close()
    process.exit(exitCode)
  }
}

createEmail()
