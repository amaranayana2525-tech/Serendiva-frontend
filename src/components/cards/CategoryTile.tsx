import { Link } from '@/i18n/navigation'
import type { Category } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { SmartImage } from '@/components/ui/SmartImage'

export interface CategoryTileProps {
  category: Category
  headingLevel?: 'h2' | 'h3'
  className?: string
}

/**
 * Home "Choose Your Island Horizon" tile (Stitch markup: 4:3 photo, teal scrim, kicker / name / description).
 * The whole tile is the link to /tours?category=… (hover: lift shadow + slow zoom; keyboard: inset focus ring).
 */
export function CategoryTile({ category, headingLevel: Heading = 'h3', className }: CategoryTileProps) {
  return (
    <Link
      href={{ pathname: '/tours', query: { category: category.slug } }}
      className={cn(
        'group relative block aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-surface shadow-sm transition-all hover:shadow-xl',
        'focus-visible:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low',
        className,
      )}
    >
      <SmartImage
        image={category.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-space-lg">
        {category.kicker && (
          <span className="font-label-md text-label-md uppercase tracking-wider text-secondary-fixed">
            {category.kicker}
          </span>
        )}
        <Heading className="font-headline-md text-headline-md text-surface">{category.name}</Heading>
        {category.description && (
          <p className="line-clamp-2 font-caption text-caption text-surface/80">{category.description}</p>
        )}
      </div>
    </Link>
  )
}
