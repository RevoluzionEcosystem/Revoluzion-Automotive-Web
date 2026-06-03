import Link from 'next/link'

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g

interface Segment {
  start: number
  end: number
  type: 'url' | 'mention'
  value: string
}

export function PostContent({ content }: { content: string }) {
  const segments: Segment[] = []

  let m: RegExpExecArray | null

  URL_REGEX.lastIndex = 0
  while ((m = URL_REGEX.exec(content)) !== null) {
    segments.push({ start: m.index, end: m.index + m[0].length, type: 'url', value: m[0] })
  }

  MENTION_REGEX.lastIndex = 0
  while ((m = MENTION_REGEX.exec(content)) !== null) {
    segments.push({ start: m.index, end: m.index + m[0].length, type: 'mention', value: m[1] })
  }

  segments.sort((a, b) => a.start - b.start)

  const nodes: React.ReactNode[] = []
  let lastIndex = 0

  for (const seg of segments) {
    if (seg.start < lastIndex) continue
    if (seg.start > lastIndex) {
      nodes.push(content.slice(lastIndex, seg.start))
    }
    if (seg.type === 'url') {
      nodes.push(
        <a
          key={seg.start}
          href={seg.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {seg.value}
        </a>,
      )
    } else {
      nodes.push(
        <Link
          key={seg.start}
          href={`/u/${seg.value}`}
          className="text-primary hover:underline font-medium"
        >
          @{seg.value}
        </Link>,
      )
    }
    lastIndex = seg.end
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return (
    <p className="text-text-primary text-sm leading-relaxed mb-3 whitespace-pre-wrap">
      {nodes}
    </p>
  )
}
