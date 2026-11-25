/**
 * Admin kit — reusable building blocks for every /admin screen. Import from here:
 *   import { PageHeader, DataTable, useToast, useConfirm } from '@/components/admin/kit'
 * Usage guide: src/components/admin/README.md · live demo: /admin/kit (development only).
 */

// layout & surfaces
export { Button, IconButton, type AdminButtonProps, type AdminButtonVariant, type IconButtonProps } from './Button'
export { Card, type CardProps } from './Card'
export { PageHeader, type Crumb, type PageHeaderProps } from './PageHeader'
export { DetailList, DetailSection, type DetailItem, type DetailListProps, type DetailSectionProps } from './DetailList'
export { EmptyPanel, ErrorPanel, LoadingPanel, type EmptyPanelProps, type ErrorPanelProps, type LoadingPanelProps } from './Panels'
export { StatusBadge, STATUS_VALUES, useStatusLabel, type StatusKind, type StatusValue, type StatusBadgeProps } from './StatusBadge'

// lists
export { DataTable, type DataTableColumn, type DataTableProps, type DataTableSelection } from './DataTable'
export { FilterBar, FilterTabs, type FilterField, type FilterBarProps, type FilterTab, type FilterTabsProps } from './FilterBar'
export { AdminPagination, pageWindow, type AdminPaginationProps } from './AdminPagination'

// overlays & feedback
export { Drawer, type DrawerProps } from './Drawer'
export { Modal, useModalDialog, type ModalProps } from './Modal'
export { Toaster, useToast } from './Toaster'
export { ConfirmDialog, ConfirmProvider, useConfirm, type ConfirmDialogProps } from './ConfirmDialog'

// form controls
export { FieldShell, CharCount, useAdminField, controlClass, type FieldShellProps } from './form/FieldShell'
export { TextField, ShellInput, type TextFieldProps } from './form/TextField'
export { TextArea, ShellTextarea, type TextAreaProps } from './form/TextArea'
export { SelectField, ShellSelect, type SelectFieldProps, type SelectOption } from './form/SelectField'
export { Switch, type SwitchProps } from './form/Switch'
export { CheckboxGroup, type CheckboxGroupProps, type CheckboxOption } from './form/CheckboxGroup'
export { NumberField, type NumberFieldProps } from './form/NumberField'
export { DateField, type DateFieldProps } from './form/DateField'
export { SlugField, slugify, SLUG_PATTERN, type SlugFieldProps } from './form/SlugField'
export { TagInput, type TagInputProps } from './form/TagInput'

// translations
export { LocaleTabs, TranslatableText, useLocaleTab, type LocaleTabsProps, type TranslatableTextProps } from './LocaleTabs'
export * as translatable from '@/lib/admin/translatable'
export type { AdminLocale, Translatable } from '@/lib/admin/translatable'

// structured content
export { Repeater, type RepeaterProps, type RepeaterItemHelpers } from './Repeater'
export { SortableList, moveItem, type SortableListProps, type SortableItemContext } from './SortableList'
export { MediaPicker, type MediaPickerProps } from './media/MediaPicker'
export { ImageField, type ImageFieldProps } from './media/ImageField'
export {
  GalleryField,
  toGalleryWrite,
  type GalleryFieldProps,
  type GalleryFieldItem,
  type GalleryCaption,
} from './media/GalleryField'
export { MediaThumb, isImageMedia, toMediaRef, type MediaThumbProps } from './media/MediaThumb'
export { IconPicker, type IconPickerProps } from './IconPicker'
export { MarkdownEditor, type MarkdownEditorProps } from './MarkdownEditor'

// charts & figures
export { BarChart, BarList, StatCard, niceTicks, type ChartDatum, type BarChartProps, type BarListProps, type StatCardProps } from './charts'

// actions
export {
  CsvExportButton,
  CopyButton,
  WhatsAppReplyButton,
  EmailReplyButton,
  useWhatsAppReplyHref,
  type CsvExportButtonProps,
  type CopyButtonProps,
  type WhatsAppReplyButtonProps,
  type EmailReplyButtonProps,
} from './actions'

// hooks re-exported for convenience (implemented in src/lib/admin)
export { useUnsavedChanges, useAdminRouter, confirmDiscardChanges, skipUnsavedCheck } from '@/lib/admin/unsaved'
export { useUrlState, useUrlParam, useDrawerParam, type UrlState } from '@/lib/admin/url-state'
export {
  useAdminQuery,
  useAdminMutation,
  invalidateAdminQueries,
  useAdminErrorMessage,
  useDebouncedValue,
} from '@/lib/admin/hooks'
