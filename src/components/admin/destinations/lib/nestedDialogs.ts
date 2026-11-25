import type { ComponentProps, SyntheticEvent } from 'react'

/**
 * React propagates a dialog's `cancel` event (Esc) through the React tree, so Esc in a MediaPicker / IconPicker
 * opened inside a Drawer would also close the Drawer. Spread these props on the drawer's content root so only the
 * innermost dialog handles it: `<form {...nestedDialogGuard}>`. (React's types only declare onCancel on <dialog>.)
 */
export const nestedDialogGuard: Pick<ComponentProps<'dialog'>, 'onCancel'> = {
  onCancel: (event: SyntheticEvent) => {
    if (event.target !== event.currentTarget) event.stopPropagation()
  },
}
