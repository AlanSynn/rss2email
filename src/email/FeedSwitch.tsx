import { Output } from 'rss-parser'
import { CustomItem } from '../parseFeeds'
import GenericFeed from './GenericFeed'

interface Props {
  feed: Output<CustomItem>
  hasBottomSeparator: boolean
}

export default ({ feed, hasBottomSeparator }: Props) => {
  return <GenericFeed key={feed.link} feed={feed} hasBottomSeparator={hasBottomSeparator} />
}
