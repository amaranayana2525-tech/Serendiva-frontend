'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/admin/kit/Card'
import { Repeater } from '@/components/admin/kit/Repeater'
import { NumberField } from '@/components/admin/kit/form/NumberField'
import { TextField } from '@/components/admin/kit/form/TextField'
import { GalleryField } from '@/components/admin/kit/media/GalleryField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { emptyMapPoint, LIMITS, type MapPoint } from '../lib/destinationForm'
import { useEditor } from './EditorContext'
import { ItemMarker } from './parts'

/** Map & gallery tab: cover image, captioned gallery (captions per language) and map points. */
export function MediaTab() {
  const t = useTranslations('adminContent.editor')
  const tl = useTranslations('admin.kit.locales')
  const { form, locale, epoch, set, err } = useEditor()

  return (
    <div className="flex flex-col gap-5">
      <Card title={t('sections.cover')} icon="image" description={t('sectionHints.cover')}>
        <ImageField
          label={t('fields.cover')}
          value={form.cover}
          onChange={(cover) => set('cover', cover)}
          aspect="video"
          folder="destinations"
          error={err('coverId')}
        />
      </Card>

      <Card
        title={t('sections.gallery')}
        icon="photo_library"
        description={t('sectionHints.gallery', { language: tl(`${locale}.name`) })}
      >
        <GalleryField
          label={t('fields.gallery')}
          value={form.gallery}
          onChange={(gallery) => set('gallery', gallery)}
          locale={locale}
          max={LIMITS.gallery}
          folder="destinations"
          error={err('gallery')}
        />
      </Card>

      <Card title={t('sections.mapPoints')} icon="pin_drop" description={t('sectionHints.mapPoints')}>
        <Repeater<MapPoint>
          key={`map-${epoch}`}
          label={t('fields.mapPoints')}
          hideLabel
          items={form.mapPoints}
          onChange={(items) => set('mapPoints', items)}
          createItem={emptyMapPoint}
          max={LIMITS.mapPoints}
          collapsible={false}
          addLabel={t('add.mapPoint')}
          itemLabel={(item, i) => item.name || t('untitled', { n: i + 1 })}
          headerExtra={(_item, i) => <ItemMarker prefix={`mapPoints.${i}`} />}
          renderItem={(item, h) => {
            const p = `mapPoints.${h.index}`
            return (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <TextField
                  label={t('fields.pointName')}
                  required
                  value={item.name}
                  maxLength={LIMITS.mapPointName}
                  placeholder={t('placeholders.pointName')}
                  onChange={(e) => h.update({ name: e.target.value })}
                  error={err(`${p}.name`)}
                />
                <NumberField
                  label={t('fields.latitude')}
                  required
                  decimal
                  min={-90}
                  max={90}
                  value={item.lat}
                  onChange={(lat) => h.update({ lat })}
                  error={err(`${p}.lat`)}
                />
                <NumberField
                  label={t('fields.longitude')}
                  required
                  decimal
                  min={-180}
                  max={180}
                  value={item.lng}
                  onChange={(lng) => h.update({ lng })}
                  error={err(`${p}.lng`)}
                />
              </div>
            )
          }}
        />
      </Card>
    </div>
  )
}
