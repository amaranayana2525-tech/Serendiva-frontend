'use client'

import dynamic from 'next/dynamic'

/** Lightbox loaded on demand (keeps it out of the initial bundle). Same props as ./Lightbox. */
export const LightboxLazy = dynamic(() => import('./Lightbox'), { ssr: false })
