import type { ComponentProps, ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from '@/i18n/navigation'
import { createSlugger } from '@/lib/slug'
import { cn } from '@/lib/utils'

interface HastNode {
  type: string
  value?: string
  children?: HastNode[]
}

const textOf = (node: HastNode | undefined): string =>
  !node ? '' : node.type === 'text' ? (node.value ?? '') : (node.children ?? []).map(textOf).join('')

export interface MarkdownProps {
  children: string
  className?: string
  /** Demote headings by one level (e.g. tour descriptions under an h2 section). */
  shiftHeadings?: boolean
}

/**
 * Renders API markdown (blog posts, tour/destination descriptions) with GFM, no raw HTML, Stitch typography (`.markdown`
 * in globals.css) and heading ids identical to the API's `headings` (github-slugger) for the table of contents.
 */
export function Markdown({ children, className, shiftHeadings = false }: MarkdownProps) {
  const slug = createSlugger()
  const heading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    function MarkdownHeading({ node, children: content }: { node?: unknown; children?: ReactNode }) {
      const id = slug(textOf(node as HastNode))
      const Tag = `h${Math.min(6, level + (shiftHeadings ? 1 : 0))}` as 'h2'
      return <Tag id={id}>{content}</Tag>
    }
    return MarkdownHeading
  }

  const components: Components = {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    h5: heading(5),
    h6: heading(6),
    a: ({ href = '', children: content, node: _node, ...rest }: ComponentProps<'a'> & { node?: unknown }) => {
      if (href.startsWith('/')) {
        return (
          <Link href={href} {...rest}>
            {content}
          </Link>
        )
      }
      const external = /^https?:\/\//.test(href)
      return (
        <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
          {content}
        </a>
      )
    },
    img: ({ src, alt = '', node: _node, ...rest }: ComponentProps<'img'> & { node?: unknown }) =>
      typeof src === 'string' ? (
        // eslint-disable-next-line @next/next/no-img-element -- CMS markdown images have unknown dimensions
        <img src={src} alt={alt} loading="lazy" decoding="async" {...rest} />
      ) : null,
    table: ({ node: _node, ...rest }: ComponentProps<'table'> & { node?: unknown }) => (
      <div className="relative overflow-x-auto">
        <table {...rest} />
      </div>
    ),
  }

  // Slugs must be generated once per render in document order — the slugger above is created per render.
  return (
    <div className={cn('markdown', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  )
}
