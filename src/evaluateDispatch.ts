import { Dayjs } from 'dayjs'
import { filterItemsFromFeed } from './filterItems'
import { getItemCount } from './getItemCount'
import { parseLastSuccess } from './parseLastSuccess'
import { parseFeeds, SettledFeed } from './parseFeeds'

const LIMIT_ITEMS_INITIAL_RUN = 3

type SkipReason = 'no-new-items' | 'no-new-items-with-partial-feed-failures'
type FailReason = 'all-feeds-failed' | 'invalid-last-success'

interface DispatchContext {
  allFeeds: SettledFeed[]
}

interface SuccessfulDispatchContext extends DispatchContext {
  filteredFeeds: SettledFeed[]
  from: Dayjs
  initialRun: boolean
}

export type DispatchDecision =
  | ({
      kind: 'send'
      itemCount: number
    } & SuccessfulDispatchContext)
  | ({
      kind: 'skip'
      reason: SkipReason
      itemCount: 0
    } & SuccessfulDispatchContext)
  | ({
      kind: 'fail'
      reason: FailReason
      error?: Error
    } & DispatchContext)

export type SuccessfulDispatchDecision = Extract<DispatchDecision, { kind: 'send' | 'skip' }>

interface EvaluateDispatchProps {
  cache?: SettledFeed[]
  lastSuccess?: string
}

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

export async function evaluateDispatch({ cache, lastSuccess }: EvaluateDispatchProps): Promise<DispatchDecision> {
  let from: Dayjs
  let initialRun: boolean

  try {
    ;({ from, initialRun } = parseLastSuccess(lastSuccess))
  } catch (error) {
    return {
      kind: 'fail',
      reason: 'invalid-last-success',
      error: toError(error),
      allFeeds: [],
    }
  }

  const allFeeds = cache ?? (await parseFeeds())
  const filteredFeeds = filterItemsFromFeed(allFeeds, from, initialRun ? LIMIT_ITEMS_INITIAL_RUN : undefined)
  const itemCount = getItemCount(filteredFeeds)

  if (itemCount > 0) {
    return {
      kind: 'send',
      itemCount,
      filteredFeeds,
      allFeeds,
      from,
      initialRun,
    }
  }

  const hasFulfilledFeed = allFeeds.some((feed) => feed.status === 'fulfilled')

  if (!hasFulfilledFeed) {
    return {
      kind: 'fail',
      reason: 'all-feeds-failed',
      allFeeds,
    }
  }

  return {
    kind: 'skip',
    reason: allFeeds.some((feed) => feed.status === 'rejected') ? 'no-new-items-with-partial-feed-failures' : 'no-new-items',
    itemCount: 0,
    filteredFeeds,
    allFeeds,
    from,
    initialRun,
  }
}
