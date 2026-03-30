import { Container } from '@react-email/container'
import { Hr } from '@react-email/hr'
import { Link } from '@react-email/link'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import { Output } from 'rss-parser'
import { CustomItem } from '../parseFeeds'
import { formatDate } from '../utils/formatter'
import { parseLinks } from './parseLinks'

interface Props {
  feed: Output<CustomItem>
  hasBottomSeparator: boolean
}

export default ({ feed, hasBottomSeparator }: Props) => {
  return (
    <Container style={box}>
      <Text style={header}>
        <Link style={headerLink} href={feed.link}>
          {feed.title}
        </Link>
      </Text>
      {feed.items.map((item) => {
        const href = parseLinks(item.links)
        const title = item.title?.trim() || href || 'Untitled post'

        return (
          <Container key={item.guid ?? item.id ?? href} style={itemCard}>
            <Text style={itemTitle}>
              <Link style={itemTitleLink} href={href}>
                {title}
              </Link>
            </Text>
            {item.pubDate && <Text style={itemMeta}>{formatDate(item.pubDate)}</Text>}
          </Container>
        )
      })}
      {hasBottomSeparator && (
        <Section>
          <Hr style={hr} />
        </Section>
      )}
    </Container>
  )
}

const box = {
  padding: '32px 32px 24px',
}

const header = {
  color: '#0f172a',
  fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif',
  fontSize: '13px',
  letterSpacing: '0.08em',
  margin: '0 0 20px',
  textTransform: 'uppercase' as const,
}

const headerLink = {
  color: '#64748b',
  textDecoration: 'none',
}

const itemCard = {
  margin: '0 0 14px',
  padding: '16px 18px',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
}

const itemTitle = {
  margin: '0 0 6px',
}

const itemTitleLink = {
  fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif',
  color: '#0f172a',
  fontSize: '18px',
  lineHeight: '26px',
  textDecoration: 'none',
  fontWeight: 600,
}

const itemMeta = {
  color: '#475569',
  fontFamily: 'Dank Mono,Operator Mono,Inconsolata,Fira Mono,ui-monospace,SF Mono,Monaco,Droid Sans Mono,Source Code Pro,monospace',
  fontSize: '12px',
  margin: 0,
}

const hr = {
  margin: '24px 0 0',
  borderTopColor: '#dee2e6',
}
