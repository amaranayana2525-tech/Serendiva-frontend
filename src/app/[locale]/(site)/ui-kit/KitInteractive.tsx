'use client'

// Dev-only interactive demos for /ui-kit (Tabs, Dialog, Lightbox, form controls, Pagination in button mode).
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, RadioCard, Select, Textarea } from '@/components/ui/Field'
import { Dialog } from '@/components/ui/Dialog'
import { LightboxLazy } from '@/components/ui/LightboxLazy'
import { Pagination } from '@/components/ui/Pagination'
import { Tabs } from '@/components/ui/Tabs'

export function KitInteractive() {
  const [tab, setTab] = useState('all')
  const [dialog, setDialog] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [page, setPage] = useState(3)

  return (
    <div className="flex flex-col gap-space-xl">
      <div className="flex flex-col gap-space-md">
        <h3 className="font-headline-sm text-headline-sm text-primary">Tabs (pill + underline)</h3>
        <Tabs
          label="Regions"
          value={tab}
          onValueChange={setTab}
          items={[
            {
              id: 'all',
              label: 'All Regions',
              icon: 'travel_explore',
              content: <p className="pt-space-sm font-body-md text-body-md">All regions panel</p>,
            },
            {
              id: 'hill',
              label: 'Hill Country',
              content: <p className="pt-space-sm font-body-md text-body-md">Hill country panel</p>,
            },
            {
              id: 'coast',
              label: 'Southern Coast',
              content: <p className="pt-space-sm font-body-md text-body-md">Coast panel</p>,
            },
            { id: 'north', label: 'North (soon)', disabled: true, content: null },
          ]}
        />
        <Tabs
          label="Tour sections"
          variant="underline"
          items={[
            {
              id: 'overview',
              label: 'Overview',
              icon: 'info',
              content: <p className="pt-space-sm font-body-md text-body-md">Overview</p>,
            },
            {
              id: 'itinerary',
              label: 'Itinerary',
              icon: 'route',
              content: <p className="pt-space-sm font-body-md text-body-md">Itinerary</p>,
            },
            {
              id: 'faq',
              label: 'Essential FAQ',
              icon: 'help_outline',
              content: <p className="pt-space-sm font-body-md text-body-md">FAQ</p>,
            },
          ]}
        />
      </div>

      <div className="grid gap-space-lg md:grid-cols-2">
        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg">
          <h3 className="font-headline-sm text-headline-sm text-primary">Field + controls</h3>
          <Field label="Full Name" required hint="As written in your passport.">
            <Input placeholder="e.g. Lord & Lady Montgomery" />
          </Field>
          <Field label="Email Address" required error="email">
            <Input type="email" defaultValue="not-an-email" />
          </Field>
          <Field label="Estimated Month">
            <Select
              options={[
                { value: '2027-01', label: 'January 2027' },
                { value: 'flex', label: 'I am flexible' },
              ]}
              placeholder="Please choose"
            />
          </Field>
          <Field label="Search" hideLabel>
            <Input variant="white" icon="search" placeholder="Search by destination, interest, or temple..." />
          </Field>
          <Field label="Expedition Focus" labelIcon="interests">
            <Select variant="muted" chevron options={[{ value: 'culture', label: 'Cultural Triangle & Heritage' }]} />
          </Field>
          <Field label="Custom Preferences / Inquiries" error="tooLong:5000">
            <Textarea rows={3} placeholder="Dietary preferences, villa upgrades…" />
          </Field>
          <Checkbox label="My dates are flexible" description="± 1 week is fine" />
        </div>
        <div className="flex flex-col gap-space-md">
          <h3 className="font-headline-sm text-headline-sm text-primary">RadioCard</h3>
          <div className="grid grid-cols-2 gap-space-sm">
            <RadioCard
              name="pace"
              value="slow"
              title="Slow & deep"
              description="2 nights per stop"
              icon="spa"
              defaultChecked
            />
            <RadioCard name="pace" value="balanced" title="Balanced" description="Mix of both" icon="tune" />
            <RadioCard name="interest" type="checkbox" value="wildlife" title="Wildlife" icon="pets" />
            <RadioCard
              name="interest"
              type="checkbox"
              value="tea"
              title="Tea hills"
              icon="emoji_food_beverage"
              defaultChecked
            />
          </div>
          <h3 className="pt-space-md font-headline-sm text-headline-sm text-primary">Dialog & Lightbox</h3>
          <div className="flex flex-wrap gap-space-sm">
            <Button onClick={() => setDialog(true)} leadingIcon="open_in_new">
              Open dialog
            </Button>
            <Button variant="secondary" onClick={() => setLightbox(0)} leadingIcon="photo_library">
              Open lightbox
            </Button>
          </div>
          <h3 className="pt-space-md font-headline-sm text-headline-sm text-primary">Pagination (button mode)</h3>
          <Pagination page={page} totalPages={12} onPageChange={setPage} />
        </div>
      </div>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Bespoke inquiry"
        description="Native <dialog>: focus trap, Esc, teal blurred backdrop."
      >
        <p className="font-body-md text-body-md text-on-surface-variant">Any content goes here.</p>
        <div className="flex justify-end">
          <Button variant="accent" onClick={() => setDialog(false)}>
            Done
          </Button>
        </div>
      </Dialog>
      <LightboxLazy
        index={lightbox}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
        items={[
          { image: null, title: 'Sigiriya at dawn', caption: 'Placeholder (no image)' },
          { image: null, title: 'Nine Arch Bridge', caption: 'Use ← / → and Esc' },
          { image: null, title: 'Mirissa', caption: null },
        ]}
      />
    </div>
  )
}
