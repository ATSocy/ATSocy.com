import { visit } from 'unist-util-visit';
import type { Blockquote, Root, Text, Paragraph } from 'mdast';

/**
 * remark-ats-commentary — turns a blockquote opened with a `[!ATS]` /
 * `[!ATSOCY]` sentinel into an `<aside data-node-type="ats-commentary">`
 * whose styling (quote-mark decoration, cycling alien image) lives in
 * `design-system.css`. The sentinel line is stripped; the rest of the
 * blockquote becomes the aside's content.
 *
 * Cycling image (`data-ats-image`) and side (`data-ats-side`) are derived from
 * the blockquote's document order so consecutive commentary blocks alternate.
 */
const SENTINEL_RE = /^\s*\[!?ATS(?:OCY)?\](?:\s+|\n|$)/i;
const IMAGE_CYCLE = 5;

interface CommentaryState {
  count: number;
}

/**
 * First text/break child of a paragraph that should be inspected for the
 * sentinel. A leading `<br>` is skipped; anything else non-texty means this
 * blockquote isn't a commentary candidate.
 */
function firstTextChild(paragraph: Paragraph): Text | null {
  for (const child of paragraph.children) {
    if (child.type === 'text') return child;
    if (child.type === 'break') continue;
    return null;
  }
  return null;
}

/** A paragraph is empty once text is stripped (only whitespace/breaks remain). */
function paragraphIsEmpty(paragraph: Paragraph): boolean {
  return paragraph.children.every((child) => {
    if (child.type === 'text') return child.value.trim().length === 0;
    return child.type === 'break';
  });
}

function commentaryProps(state: CommentaryState) {
  const index = state.count;
  state.count += 1;
  return {
    'data-node-type': 'ats-commentary',
    'data-ats-image': String((index % IMAGE_CYCLE) + 1),
    'data-ats-side': index % 2 === 0 ? 'left' : 'right',
  } as const;
}

/** Rewrite a blockquote node in place as a commentary aside. */
function markAsCommentary(node: Blockquote, state: CommentaryState): void {
  const hProperties = {
    ...(node.data?.hProperties as Record<string, unknown> | undefined),
    ...commentaryProps(state),
  };
  node.data = {
    ...node.data,
    hName: 'aside',
    hProperties,
  };
}

/**
 * Strip the sentinel from a blockquote and mark it as commentary. No-op for
 * blockquotes that don't open with `[!ATS]` / `[!ATSOCY]`.
 */
function transformCommentaryBlockquote(node: Blockquote, state: CommentaryState): void {
  const firstChild = node.children[0];
  if (firstChild?.type !== 'paragraph') return;

  const firstText = firstTextChild(firstChild);
  if (!firstText?.value) return;

  const match = firstText.value.match(SENTINEL_RE);
  if (!match) return;

  firstText.value = firstText.value.slice(match[0].length);
  if (paragraphIsEmpty(firstChild)) {
    node.children.shift();
  }

  markAsCommentary(node, state);
}

export default function remarkAtsCommentary() {
  return (tree: Root) => {
    const state: CommentaryState = { count: 0 };
    visit(tree, 'blockquote', (node: Blockquote) => {
      transformCommentaryBlockquote(node, state);
    });
  };
}
