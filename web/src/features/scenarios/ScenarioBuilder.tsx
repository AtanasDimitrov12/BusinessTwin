import { Plus, Save } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChangeType } from '../../api/client'
import { BusinessMap } from '../../components/BusinessMap'
import { CasePlume } from '../../components/charts/ResultCharts'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { ConflictNote } from '../../components/ui/ConflictNote'
import { Card, ErrorNote, PageHeader, Segmented, Spinner } from '../../components/ui/primitives'
import { isNegative, isZero } from '../../lib/format'
import { useBaseline } from '../baseline/baseline'
import { ChangeEditor } from './ChangeEditor'
import { changeMeta, defaultChange, fromScenarioDto, horizonOptions, isComplete, toChangeDto, type ScenarioForm } from './changeForm'
import { CashWarning, KeyFacts, ResultHeadline } from './ResultParts'
import { caseOf, highlightedFor, mapNodes } from './resultHelpers'
import { fetchScenario, useSaveScenario, useScenario, useSimulation } from './scenarios'

/** "Test a decision": stack one or more changes and see the result recalculated by the API as you type. */
export function ScenarioBuilderPage() {
  const { id } = useParams()
  const scenario = useScenario(id)
  // Bumped by "Load the latest version" after an edit conflict: the editor starts again from the fresh copy.
  // (A background refetch alone never resets the editor: it copies the plan once, when it opens.)
  const [loads, setLoads] = useState(0)
  if (id && scenario.isPending) return <Spinner />
  if (id && !scenario.data) return <ErrorNote error={scenario.error ?? new Error('This plan does not exist.')} />
  return (
    <ScenarioBuilder
      key={`${id ?? 'new'}-${loads}`}
      id={id}
      initial={scenario.data ? fromScenarioDto(scenario.data) : undefined}
      version={scenario.data?.version}
      onReload={() => setLoads((n) => n + 1)}
    />
  )
}

function ScenarioBuilder({
  id,
  initial,
  version: openedVersion,
  onReload,
}: {
  id?: string
  initial?: ScenarioForm
  /** The version this editor opened; saves send it so the API can refuse one that would overwrite newer edits. */
  version?: number
  onReload: () => void
}) {
  const navigate = useNavigate()
  const baseline = useBaseline()
  const save = useSaveScenario()
  const queryClient = useQueryClient()
  const version = useRef(openedVersion)
  const [resolving, setResolving] = useState(false)
  const [form, setForm] = useState<ScenarioForm>(initial ?? { name: '', horizonMonths: 12, changes: [] })

  const draft = useMemo(
    () =>
      form.changes.length > 0 && form.changes.every(isComplete)
        ? { horizonMonths: form.horizonMonths, changes: form.changes.map(toChangeDto) }
        : null,
    [form.changes, form.horizonMonths],
  )
  const simulation = useSimulation(draft)

  const addChange = (type: ChangeType) =>
    setForm((f) => ({
      ...f,
      name: f.name || changeMeta[type].defaultName,
      changes: [...f.changes, defaultChange(type, baseline.data?.averagePrice)],
    }))

  const onSave = async () => {
    const saved = await save.mutateAsync({
      id,
      body: {
        name: form.name.trim() || 'My plan',
        horizonMonths: form.horizonMonths,
        changes: form.changes.map(toChangeDto),
        status: 'saved',
        version: version.current,
      },
    })
    navigate(`/app/plans/${saved.id}`)
  }

  /** After an edit conflict: start again from what is saved now, or save these edits over it. */
  const resolveConflict = async (keepMine: boolean) => {
    if (!id) return
    setResolving(true)
    try {
      const latest = await queryClient.fetchQuery({ queryKey: ['scenarios', id], queryFn: () => fetchScenario(id), staleTime: 0 })
      save.reset()
      if (!keepMine) return onReload()
      version.current = latest?.version
      await onSave()
    } finally {
      setResolving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Test a decision"
        sub="Add one or more changes. Enter a pessimistic, expected and optimistic guess for anything uncertain: results update as you type."
        actions={
          form.changes.length > 0 && (
            <Button onClick={() => onSave().catch(() => {})} disabled={save.isPending || !draft}>
              <Save size={16} /> {id ? 'Save changes' : 'Save plan'}
            </Button>
          )
        }
      />
      <ConflictNote
        error={save.error}
        what="this plan"
        busy={resolving || save.isPending}
        onLoadLatest={() => resolveConflict(false).catch(() => {})}
        onKeepMine={() => resolveConflict(true).catch(() => {})}
      />

      {form.changes.length === 0 ? (
        <DecisionPicker onPick={addChange} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Card className="space-y-4 p-5">
              <Field label="Plan name" value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="space-y-1">
                <span className="block text-sm font-semibold">Look ahead</span>
                <Segmented
                  fullWidth
                  label="Time horizon"
                  value={String(form.horizonMonths)}
                  options={horizonOptions.map((m) => ({ value: String(m), label: `${m} mo` }))}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      horizonMonths: Number(v),
                      changes: f.changes.map((c) => ({ ...c, startMonth: Math.min(c.startMonth, Number(v)) })),
                    }))
                  }
                />
              </div>
            </Card>

            {form.changes.map((change, i) => (
              <ChangeEditor
                key={i}
                index={i}
                change={change}
                horizonMonths={form.horizonMonths}
                onChange={(c) => setForm((f) => ({ ...f, changes: f.changes.map((x, j) => (j === i ? c : x)) }))}
                onRemove={() => setForm((f) => ({ ...f, changes: f.changes.filter((_, j) => j !== i) }))}
              />
            ))}

            {form.changes.length < 10 && (
              <div className="rounded-[var(--radius-card)] border-2 border-dashed border-black/[0.1] p-5">
                <p className="mb-3 text-sm font-semibold text-muted">Combine with another change</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(changeMeta) as ChangeType[]).map((t) => {
                    const Icon = changeMeta[t].icon
                    return (
                      <Button key={t} variant="secondary" size="sm" onClick={() => addChange(t)}>
                        <Plus size={14} /> <Icon size={14} /> {changeMeta[t].short}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-4 lg:sticky lg:top-6">
              <LivePreview simulation={simulation} complete={!!draft} types={form.changes.map((c) => c.type)} horizonMonths={form.horizonMonths} />
              {id && (
                <Button variant="ghost" onClick={() => navigate(`/app/plans/${id}`)}>
                  See the full outcome
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DecisionPicker({ onPick }: { onPick: (type: ChangeType) => void }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-bold">What are you thinking about?</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(changeMeta) as ChangeType[]).map((t) => {
          const m = changeMeta[t]
          const Icon = m.icon
          return (
            <button
              key={t}
              type="button"
              onClick={() => onPick(t)}
              className="group flex flex-col items-start rounded-[var(--radius-card)] bg-surface p-7 text-left shadow-card transition-[translate,scale,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
            >
              <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon size={22} aria-hidden />
              </span>
              <span className="font-display text-xl font-bold">{m.title}</span>
              <span className="mt-1 text-sm leading-relaxed text-muted">{m.description}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                Start
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LivePreview({
  simulation,
  complete,
  types,
  horizonMonths,
}: {
  simulation: ReturnType<typeof useSimulation>
  complete: boolean
  types: ChangeType[]
  horizonMonths: number
}) {
  const result = simulation.data
  if (!complete && !result)
    return <Card className="p-8 text-center text-sm text-muted">Fill in every field to see the result. Fields marked in red need a correction.</Card>
  if (simulation.isPending) return <Spinner label="Calculating…" />

  return (
    <div className="space-y-4" aria-live="polite" aria-busy={simulation.isFetching}>
      {simulation.error && <ErrorNote error={simulation.error} />}
      {result && (
        <div className={`transition-opacity duration-200 ${simulation.isFetching || simulation.isError ? 'opacity-60 delay-200' : ''}`}>
          <div className="space-y-4">
            <ResultHeadline result={result} caseKey="expected" />
            <KeyFacts result={caseOf(result, 'expected')} horizonMonths={result.horizonMonths} />
            <CashWarning result={result} />
            <Card className="p-5">
              <h3 className="font-display text-[17px] font-semibold">Three cases, month by month</h3>
              <p className="mb-3 text-xs text-muted">Money gained or lost compared with no change. Updates as you type.</p>
              <CasePlume result={result} />
            </Card>
            <PreviewMap result={result} types={types} horizonMonths={horizonMonths} />
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewMap({ result, types, horizonMonths }: { result: NonNullable<ReturnType<typeof useSimulation>['data']>; types: ChangeType[]; horizonMonths: number }) {
  const expected = caseOf(result, 'expected')
  const last = expected.months[expected.months.length - 1]
  const delta = expected.resultDifferenceByMonth[expected.resultDifferenceByMonth.length - 1]
  return (
    <Card className="p-5">
      <h3 className="font-display text-[17px] font-semibold">Business map in month {horizonMonths}</h3>
      <p className="mb-4 text-xs text-muted">Highlighted boxes are changed by this plan (expected case).</p>
      <BusinessMap
        nodes={mapNodes(last, delta)}
        highlighted={highlightedFor(types)}
        resultTone={isNegative(last.monthlyResult) ? 'bad' : isNegative(delta) ? 'accent' : 'good'}
        capacityLimited={!isZero(last.unservedDemand)}
      />
    </Card>
  )
}
