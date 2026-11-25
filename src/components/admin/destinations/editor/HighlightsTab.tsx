'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/admin/kit/Card'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { Repeater } from '@/components/admin/kit/Repeater'
import { TagInput } from '@/components/admin/kit/form/TagInput'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import {
  emptyFeature,
  emptyPerk,
  emptyQuickFact,
  LIMITS,
  type Feature,
  type Perk,
  type QuickFact,
} from '../lib/destinationForm'
import { StringListField } from '../ui/StringListField'
import { TranslateFromEnglish, useEditor } from './EditorContext'
import { ItemMarker } from './parts'

/** Highlights tab: quick facts, guide note (heading, paragraphs, perks), field notes, interests. */
export function HighlightsTab() {
  const t = useTranslations('adminContent.editor')
  const { locale, epoch, get, setLocal, en, err } = useEditor()
  const untitled = (n: number) => t('untitled', { n })
  const quickFactsEn = en('quickFacts')
  const fieldNotesEn = en('fieldNotes')
  const guide = get('guideNote')
  const guideEn = en('guideNote')
  const ph = (value: string | undefined) => (locale === 'en' ? undefined : value || undefined)
  const setGuide = (patch: Partial<typeof guide>) => setLocal('guideNote', { ...guide, ...patch })

  return (
    <div className="flex flex-col gap-5">
      <Card title={t('sections.quickFacts')} icon="fact_check" description={t('sectionHints.quickFacts')}>
        <div className="flex flex-col gap-3">
          <TranslateFromEnglish field="quickFacts" what={t('sections.quickFacts')} />
          <Repeater<QuickFact>
            key={`${locale}-${epoch}`}
            label={t('fields.quickFacts')}
            hideLabel
            items={get('quickFacts')}
            onChange={(items) => setLocal('quickFacts', items)}
            createItem={emptyQuickFact}
            max={LIMITS.quickFacts}
            addLabel={t('add.quickFact')}
            itemLabel={(item, i) => item.label || quickFactsEn[i]?.label || untitled(i + 1)}
            headerExtra={(item, i) => <ItemMarker prefix={`quickFacts.${locale}.${i}`} icon={item.icon} />}
            renderItem={(item, h) => {
              const p = `quickFacts.${locale}.${h.index}`
              const enItem = quickFactsEn[h.index]
              return (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <IconPicker
                    label={t('fields.icon')}
                    required
                    value={item.icon || null}
                    onChange={(icon) => h.update({ icon: icon ?? '' })}
                    error={err(`${p}.icon`)}
                  />
                  <TextField
                    label={t('fields.factLabel')}
                    required
                    value={item.label}
                    maxLength={LIMITS.quickFactLabel}
                    placeholder={ph(enItem?.label) ?? t('placeholders.factLabel')}
                    onChange={(e) => h.update({ label: e.target.value })}
                    error={err(`${p}.label`)}
                    lang={locale}
                  />
                  <TextField
                    label={t('fields.factValue')}
                    required
                    value={item.value}
                    maxLength={LIMITS.quickFactValue}
                    placeholder={ph(enItem?.value) ?? t('placeholders.factValue')}
                    onChange={(e) => h.update({ value: e.target.value })}
                    error={err(`${p}.value`)}
                    lang={locale}
                  />
                  <TextField
                    label={t('fields.factNote')}
                    value={item.note}
                    maxLength={LIMITS.quickFactNote}
                    placeholder={ph(enItem?.note)}
                    onChange={(e) => h.update({ note: e.target.value })}
                    error={err(`${p}.note`)}
                    lang={locale}
                  />
                </div>
              )
            }}
          />
        </div>
      </Card>

      <Card title={t('sections.guideNote')} icon="record_voice_over" description={t('sectionHints.guideNote')}>
        <div className="flex flex-col gap-4">
          <TranslateFromEnglish field="guideNote" what={t('sections.guideNote')} />
          <TextField
            label={t('fields.guideHeading')}
            value={guide.heading}
            maxLength={LIMITS.guideHeading}
            placeholder={ph(guideEn.heading) ?? t('placeholders.guideHeading')}
            onChange={(e) => setGuide({ heading: e.target.value })}
            error={err(`guideNote.${locale}.heading`)}
            lang={locale}
          />
          <StringListField
            key={`p-${locale}`}
            label={t('fields.paragraphs')}
            itemLabel={t('fields.paragraph')}
            addLabel={t('add.paragraph')}
            values={guide.paragraphs}
            onChange={(paragraphs) => setGuide({ paragraphs })}
            max={LIMITS.paragraphs}
            maxLength={LIMITS.paragraph}
            multiline={4}
            placeholders={locale === 'en' ? undefined : guideEn.paragraphs}
            errorAt={(i) => err(`guideNote.${locale}.paragraphs.${i}`)}
            lang={locale}
          />
          <Repeater<Perk>
            key={`perks-${locale}-${epoch}`}
            label={t('fields.perks')}
            items={guide.perks}
            onChange={(perks) => setGuide({ perks })}
            createItem={emptyPerk}
            max={LIMITS.perks}
            collapsible={false}
            addLabel={t('add.perk')}
            itemLabel={(item, i) => item.label || guideEn.perks[i]?.label || untitled(i + 1)}
            headerExtra={(item, i) => <ItemMarker prefix={`guideNote.${locale}.perks.${i}`} icon={item.icon} />}
            renderItem={(item, h) => {
              const p = `guideNote.${locale}.perks.${h.index}`
              return (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <IconPicker
                    label={t('fields.icon')}
                    required
                    value={item.icon || null}
                    onChange={(icon) => h.update({ icon: icon ?? '' })}
                    error={err(`${p}.icon`)}
                  />
                  <TextField
                    label={t('fields.perkLabel')}
                    required
                    value={item.label}
                    maxLength={LIMITS.perkLabel}
                    placeholder={ph(guideEn.perks[h.index]?.label)}
                    onChange={(e) => h.update({ label: e.target.value })}
                    error={err(`${p}.label`)}
                    lang={locale}
                  />
                </div>
              )
            }}
          />
        </div>
      </Card>

      <Card title={t('sections.fieldNotes')} icon="tips_and_updates" description={t('sectionHints.fieldNotes')}>
        <div className="flex flex-col gap-3">
          <TranslateFromEnglish field="fieldNotes" what={t('sections.fieldNotes')} />
          <FeatureRepeater
            listKey={`${locale}-${epoch}`}
            pathPrefix={`fieldNotes.${locale}`}
            label={t('fields.fieldNotes')}
            addLabel={t('add.fieldNote')}
            items={get('fieldNotes')}
            english={fieldNotesEn}
            onChange={(items) => setLocal('fieldNotes', items)}
            max={LIMITS.fieldNotes}
          />
        </div>
      </Card>

      <Card title={t('sections.interests')} icon="interests" description={t('sectionHints.interests')}>
        <div className="flex flex-col gap-3">
          <TranslateFromEnglish field="interests" what={t('sections.interests')} />
          <TagInput
            key={locale}
            label={t('fields.interests')}
            value={get('interests')}
            onChange={(v) => setLocal('interests', v)}
            max={LIMITS.interests}
            maxLength={LIMITS.interest}
            placeholder={locale === 'en' ? t('placeholders.interests') : en('interests').join(', ')}
            error={err(`interests.${locale}`)}
          />
        </div>
      </Card>
    </div>
  )
}

/** Repeater of { icon, title, text } items (field notes, cuisine dishes). */
export function FeatureRepeater({
  listKey,
  pathPrefix,
  label,
  addLabel,
  items,
  english,
  onChange,
  max,
}: {
  listKey: string
  pathPrefix: string
  label: string
  addLabel: string
  items: Feature[]
  english: readonly Feature[]
  onChange: (items: Feature[]) => void
  max: number
}) {
  const t = useTranslations('adminContent.editor')
  const { locale, err } = useEditor()
  const ph = (value: string | undefined) => (locale === 'en' ? undefined : value || undefined)
  return (
    <Repeater<Feature>
      key={listKey}
      label={label}
      hideLabel
      items={items}
      onChange={onChange}
      createItem={emptyFeature}
      max={max}
      addLabel={addLabel}
      itemLabel={(item, i) => item.title || english[i]?.title || t('untitled', { n: i + 1 })}
      headerExtra={(item, i) => <ItemMarker prefix={`${pathPrefix}.${i}`} icon={item.icon} />}
      renderItem={(item, h) => {
        const p = `${pathPrefix}.${h.index}`
        const enItem = english[h.index]
        return (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <IconPicker
              label={t('fields.icon')}
              required
              value={item.icon || null}
              onChange={(icon) => h.update({ icon: icon ?? '' })}
              error={err(`${p}.icon`)}
            />
            <TextField
              label={t('fields.title')}
              required
              value={item.title}
              maxLength={LIMITS.featureTitle}
              placeholder={ph(enItem?.title)}
              onChange={(e) => h.update({ title: e.target.value })}
              error={err(`${p}.title`)}
              lang={locale}
            />
            <TextArea
              label={t('fields.text')}
              value={item.text}
              rows={3}
              maxLength={LIMITS.featureText}
              counter
              placeholder={ph(enItem?.text)}
              onChange={(e) => h.update({ text: e.target.value })}
              error={err(`${p}.text`)}
              lang={locale}
              fieldClassName="md:col-span-2"
            />
          </div>
        )
      }}
    />
  )
}
