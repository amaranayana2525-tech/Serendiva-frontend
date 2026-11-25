'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/admin/kit/Card'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { Repeater } from '@/components/admin/kit/Repeater'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import { emptyExperience, LIMITS, type Experience } from '../lib/destinationForm'
import { TranslateFromEnglish, useEditor } from './EditorContext'
import { ItemMarker, MediaIdField } from './parts'

/** Experiences tab: up to 12 signature experiences per language, each with an image from the media library. */
export function ExperiencesTab() {
  const t = useTranslations('adminContent.editor')
  const { locale, epoch, get, setLocal, en, err } = useEditor()
  const english = en('experiences')
  const ph = (value: string | undefined) => (locale === 'en' ? undefined : value || undefined)

  return (
    <Card title={t('sections.experiences')} icon="hiking" description={t('sectionHints.experiences')}>
      <div className="flex flex-col gap-3">
        <TranslateFromEnglish field="experiences" what={t('sections.experiences')} />
        <Repeater<Experience>
          key={`${locale}-${epoch}`}
          label={t('fields.experiences')}
          items={get('experiences')}
          onChange={(items) => setLocal('experiences', items)}
          createItem={emptyExperience}
          max={LIMITS.experiences}
          addLabel={t('add.experience')}
          itemLabel={(item, i) => item.title || english[i]?.title || t('untitled', { n: i + 1 })}
          headerExtra={(item, i) => <ItemMarker prefix={`experiences.${locale}.${i}`} icon={item.tagIcon || undefined} />}
          renderItem={(item, h) => {
            const p = `experiences.${locale}.${h.index}`
            const enItem = english[h.index]
            return (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <TextField
                    label={t('fields.kicker')}
                    value={item.kicker}
                    maxLength={LIMITS.experienceKicker}
                    placeholder={ph(enItem?.kicker) ?? t('placeholders.kicker')}
                    onChange={(e) => h.update({ kicker: e.target.value })}
                    error={err(`${p}.kicker`)}
                    lang={locale}
                  />
                  <TextField
                    label={t('fields.meta')}
                    value={item.meta}
                    maxLength={LIMITS.experienceMeta}
                    placeholder={ph(enItem?.meta) ?? t('placeholders.meta')}
                    onChange={(e) => h.update({ meta: e.target.value })}
                    error={err(`${p}.meta`)}
                    lang={locale}
                  />
                  <TextField
                    label={t('fields.title')}
                    required
                    value={item.title}
                    maxLength={LIMITS.experienceTitle}
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
                    maxLength={LIMITS.experienceText}
                    counter
                    placeholder={ph(enItem?.text)}
                    onChange={(e) => h.update({ text: e.target.value })}
                    error={err(`${p}.text`)}
                    lang={locale}
                    fieldClassName="md:col-span-2"
                  />
                  <IconPicker
                    label={t('fields.tagIcon')}
                    value={item.tagIcon || null}
                    onChange={(icon) => h.update({ tagIcon: icon ?? '' })}
                    error={err(`${p}.tagIcon`)}
                  />
                  <TextField
                    label={t('fields.tagLabel')}
                    value={item.tagLabel}
                    maxLength={LIMITS.tagLabel}
                    placeholder={ph(enItem?.tagLabel) ?? t('placeholders.tagLabel')}
                    onChange={(e) => h.update({ tagLabel: e.target.value })}
                    error={err(`${p}.tagLabel`)}
                    lang={locale}
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
  )
}
