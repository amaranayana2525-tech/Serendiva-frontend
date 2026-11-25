'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/admin/kit/Card'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { Repeater } from '@/components/admin/kit/Repeater'
import { TagInput } from '@/components/admin/kit/form/TagInput'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import { emptyStay, LIMITS, type Stay } from '../lib/destinationForm'
import { TranslateFromEnglish, useEditor } from './EditorContext'
import { FeatureRepeater } from './HighlightsTab'
import { ItemMarker, MediaIdField } from './parts'

/** Food & stays tab: cuisine block (heading, intro, dishes) and the stays list (with image + feature chips). */
export function FoodStaysTab() {
  const t = useTranslations('adminContent.editor')
  const { locale, epoch, get, setLocal, en, err } = useEditor()
  const cuisine = get('cuisine')
  const cuisineEn = en('cuisine')
  const staysEn = en('stays')
  const ph = (value: string | undefined) => (locale === 'en' ? undefined : value || undefined)
  const setCuisine = (patch: Partial<typeof cuisine>) => setLocal('cuisine', { ...cuisine, ...patch })

  return (
    <div className="flex flex-col gap-5">
      <Card title={t('sections.cuisine')} icon="restaurant" description={t('sectionHints.cuisine')}>
        <div className="flex flex-col gap-4">
          <TranslateFromEnglish field="cuisine" what={t('sections.cuisine')} />
          <TextField
            label={t('fields.cuisineHeading')}
            value={cuisine.heading}
            maxLength={LIMITS.cuisineHeading}
            placeholder={ph(cuisineEn.heading) ?? t('placeholders.cuisineHeading')}
            onChange={(e) => setCuisine({ heading: e.target.value })}
            error={err(`cuisine.${locale}.heading`)}
            lang={locale}
          />
          <TextArea
            label={t('fields.cuisineIntro')}
            value={cuisine.intro}
            rows={3}
            maxLength={LIMITS.cuisineIntro}
            counter
            placeholder={ph(cuisineEn.intro)}
            onChange={(e) => setCuisine({ intro: e.target.value })}
            error={err(`cuisine.${locale}.intro`)}
            lang={locale}
          />
          <div className="flex flex-col gap-2">
            <p className="font-body-md text-[13px] font-semibold text-on-surface">
              {t('fields.dishes')}
              <span className="ml-1.5 font-normal text-on-surface-variant">
                ({cuisine.items.length} / {LIMITS.cuisineItems})
              </span>
            </p>
            <FeatureRepeater
              listKey={`dishes-${locale}-${epoch}`}
              pathPrefix={`cuisine.${locale}.items`}
              label={t('fields.dishes')}
              addLabel={t('add.dish')}
              items={cuisine.items}
              english={cuisineEn.items}
              onChange={(items) => setCuisine({ items })}
              max={LIMITS.cuisineItems}
            />
          </div>
        </div>
      </Card>

      <Card title={t('sections.stays')} icon="hotel" description={t('sectionHints.stays')}>
        <div className="flex flex-col gap-3">
          <TranslateFromEnglish field="stays" what={t('sections.stays')} />
          <Repeater<Stay>
            key={`${locale}-${epoch}`}
            label={t('fields.stays')}
            hideLabel
            items={get('stays')}
            onChange={(items) => setLocal('stays', items)}
            createItem={emptyStay}
            max={LIMITS.stays}
            addLabel={t('add.stay')}
            itemLabel={(item, i) => item.title || staysEn[i]?.title || t('untitled', { n: i + 1 })}
            headerExtra={(item, i) => <ItemMarker prefix={`stays.${locale}.${i}`} icon={item.icon || undefined} />}
            renderItem={(item, h) => {
              const p = `stays.${locale}.${h.index}`
              const enItem = staysEn[h.index]
              return (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <TextField
                      label={t('fields.stayCategory')}
                      required
                      value={item.category}
                      maxLength={LIMITS.stayCategory}
                      placeholder={ph(enItem?.category) ?? t('placeholders.stayCategory')}
                      onChange={(e) => h.update({ category: e.target.value })}
                      error={err(`${p}.category`)}
                      lang={locale}
                    />
                    <IconPicker
                      label={t('fields.icon')}
                      value={item.icon || null}
                      onChange={(icon) => h.update({ icon: icon ?? '' })}
                      error={err(`${p}.icon`)}
                    />
                    <TextField
                      label={t('fields.title')}
                      required
                      value={item.title}
                      maxLength={LIMITS.stayTitle}
                      placeholder={ph(enItem?.title)}
                      onChange={(e) => h.update({ title: e.target.value })}
                      error={err(`${p}.title`)}
                      lang={locale}
                      fieldClassName="md:col-span-2"
                    />
                    <TextArea
                      label={t('fields.text')}
                      value={item.text}
                      rows={4}
                      maxLength={LIMITS.stayText}
                      counter
                      placeholder={ph(enItem?.text)}
                      onChange={(e) => h.update({ text: e.target.value })}
                      error={err(`${p}.text`)}
                      lang={locale}
                      fieldClassName="md:col-span-2"
                    />
                    <TagInput
                      label={t('fields.stayFeatures')}
                      value={item.features}
                      onChange={(features) => h.update({ features })}
                      max={LIMITS.stayFeatures}
                      maxLength={LIMITS.stayFeature}
                      placeholder={locale === 'en' ? t('placeholders.stayFeatures') : enItem?.features.join(', ')}
                      error={err(`${p}.features`)}
                      className="md:col-span-2"
                    />
                  </div>
                  <MediaIdField
                    label={t('fields.image')}
                    imageId={item.imageId}
                    onChange={(imageId) => h.update({ imageId })}
                    error={err(`${p}.imageId`)}
                    hint={locale === 'en' ? undefined : t('hints.imagePerLanguage')}
                  />
                </div>
              )
            }}
          />
        </div>
      </Card>
    </div>
  )
}
