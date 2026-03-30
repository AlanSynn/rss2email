import { render } from '@react-email/render'
import Email from './email/Email'
import { DispatchDecision, evaluateDispatch, SuccessfulDispatchDecision } from './evaluateDispatch'
import { SettledFeed } from './parseFeeds'

interface BuildEmailHtmlProps {
  actionUrl?: string
  feeds: SettledFeed[]
  from: SuccessfulDispatchDecision['from']
  initialRun: boolean
  itemCount: number
  pretty?: boolean
}

interface RenderEmailProps {
  actionUrl?: string
  cache?: SettledFeed[]
  lastSuccess?: string
  pretty?: boolean
}

const renderDecisionHtml = async ({ actionUrl, feeds, from, initialRun, itemCount, pretty = false }: BuildEmailHtmlProps) =>
  render(<Email actionUrl={actionUrl} feeds={feeds} from={from} initialRun={initialRun} itemCount={itemCount} />, {
    pretty,
  })

const decisionToError = (decision: Extract<DispatchDecision, { kind: 'fail' }>) => {
  switch (decision.reason) {
    case 'all-feeds-failed':
      return new Error('All configured feeds failed to load')
    case 'invalid-last-success':
      return decision.error
  }
}

export const buildEmailHtml = renderDecisionHtml

export async function renderEmail({ actionUrl, cache, lastSuccess, pretty = false }: RenderEmailProps) {
  const decision = await evaluateDispatch({ cache, lastSuccess })

  switch (decision.kind) {
    case 'fail':
      throw decisionToError(decision)
    case 'send':
    case 'skip': {
      const html = await renderDecisionHtml({
        actionUrl,
        feeds: decision.filteredFeeds,
        from: decision.from,
        initialRun: decision.initialRun,
        itemCount: decision.itemCount,
        pretty,
      })

      return { html, itemCount: decision.itemCount, feeds: decision.allFeeds, decision }
    }
  }
}
