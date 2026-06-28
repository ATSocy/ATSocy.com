import { NostrIsland } from '~/components/nostr/NostrIsland';
import { CommentIcon } from '~/components/article/VoteButton';
import { useArticleCommentCount } from '~/lib/articles/useArticleComments';

export interface ArticleCommentCountProps {
  slug: string;
  href?: string;
}

export function ArticleCommentCount({ slug, href = '#comments' }: ArticleCommentCountProps) {
  return (
    <NostrIsland>
      <ArticleCommentCountInner slug={slug} href={href} />
    </NostrIsland>
  );
}

function ArticleCommentCountInner({ slug, href = '#comments' }: ArticleCommentCountProps) {
  const { count, isLoading } = useArticleCommentCount(slug);

  if (isLoading) {
    return (
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        <span className="xnn-skeleton-shimmer h-3 w-16 rounded-full" />
      </span>
    );
  }

  return (
    <a href={href} className="inline-flex cursor-pointer items-center gap-1.5 text-inherit no-underline transition-colors hover:text-fg">
      <CommentIcon />
      {count} {count === 1 ? 'comment' : 'comments'}
    </a>
  );
}
