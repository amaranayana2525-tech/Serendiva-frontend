'use client'

import dynamic from 'next/dynamic'

/** MediaLightbox loaded on demand (kept out of the initial bundle). Same props as ./MediaLightbox. */
export const MediaLightboxLazy = dynamic(() => import('./MediaLightbox'), { ssr: false })
