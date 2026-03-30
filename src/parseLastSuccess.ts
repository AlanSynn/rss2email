import dayjs from 'dayjs'

const INITIAL_RUN_SENTINELS = new Set(['', 'null', 'undefined'])

export const parseLastSuccess = (lastSuccess?: string) => {
  const normalized = lastSuccess?.trim().toLowerCase() ?? ''

  if (INITIAL_RUN_SENTINELS.has(normalized)) {
    return {
      from: dayjs().subtract(7, 'days'),
      initialRun: true,
    }
  }

  const parsed = dayjs(lastSuccess)

  if (parsed.isValid()) {
    return {
      from: parsed,
      initialRun: false,
    }
  }

  // This might happen if the workflow ran into an error while determining the last successful run
  throw new Error(`Unknown lastSuccess value: ${lastSuccess}`)
}
