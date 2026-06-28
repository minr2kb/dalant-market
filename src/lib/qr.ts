export function encodeMissionQR(
  marketId: string,
  missionId: string,
  userId: string,
  photoUrls?: string[],
) {
  const base = `dalant:m:${marketId}:${missionId}:${userId}`
  if (photoUrls && photoUrls.length > 0) return `${base}|${photoUrls.join(',')}`
  return base
}

export function encodePayQR(marketId: string, userId: string) {
  return `dalant:p:${marketId}:${userId}`
}

export type ParsedQR =
  | { type: 'mission'; marketId: string; missionId: string; userId: string; photoUrls?: string[] }
  | { type: 'pay'; marketId: string; userId: string }
  | null

export function parseQR(value: string): ParsedQR {
  const pipeIdx = value.indexOf('|')
  const photoUrls =
    pipeIdx !== -1
      ? value
          .slice(pipeIdx + 1)
          .split(',')
          .filter(Boolean)
      : undefined
  const qrPart = pipeIdx !== -1 ? value.slice(0, pipeIdx) : value
  const parts = qrPart.split(':')
  if (parts[0] !== 'dalant') return null
  if (parts[1] === 'm' && parts.length === 5)
    return { type: 'mission', marketId: parts[2], missionId: parts[3], userId: parts[4], photoUrls }
  if (parts[1] === 'p' && parts.length === 4)
    return { type: 'pay', marketId: parts[2], userId: parts[3] }
  return null
}
