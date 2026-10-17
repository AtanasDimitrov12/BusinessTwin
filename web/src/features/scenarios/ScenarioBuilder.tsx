import { ArrowRight, Plus, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChangeType } from '../../api/client'
import { BusinessMap } from '../../components/BusinessMap'
import { ImpactChart } from '../../components/charts/ResultCharts'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Card, ErrorNote, PageHeader, Segmented, Spinner } from '../../components/ui/primitives'
import { isNegative, isZero } from '../../lib/format'
import { useBaseline } from '../baseline/baseline'
import { ChangeEditor } from './ChangeEditor'
import { changeMeta, defaultChange, fromScenarioDto, horizonOptions, isComplete, toChangeDto, type ScenarioForm } from './changeForm'
import { CashWarning, KeyFacts, ResultHeadline } from './ResultParts'
import { caseOf, highlightedFor, mapNodes } from './resultHelpers'
import { useSaveScenario, useScenario, useSimulation } from './scenarios'

/** "Test a decision": stack one or more changes and see the result recalculated by the API as you type. */
export function ScenarioBuilderPage() {
  const { id } = useParams()
  const scenario = useScenario(id)
  if (id && scenario.isPending) return <Spinner />
  if (id && !scenario.data) return <ErrorNote error={scenario.error ?? new Error('This plan does not exist.')} />
  return <ScenarioBuilder key={id ?? 'new'} id={id} initial={scenario.data ? fromScenarioDto(scenario.data) : undefined} />
}

function ScenarioBuilder({ id, initial }: { id?: string; initial?: ScenarioForm }) {
  const navigate = useNavigate()
  const baseline = useBaseline()
  const save = useSaveScenario()
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
      body: { name: form.name.trim() || 'My plan', horizonMonths: form.horizonMonths, changes: form.changes.map(toChangeDto), status: 'saved' },
    })
    navigate(`/app/plans/${saved.id}`)
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
      <ErrorNote error={save.error} />

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
              <div className="rounded-2xl border-2 border-dashed border-line p-4">
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
                  See the full outcome <ArrowRight size={16} />
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
      <h2 className="mb-4 font-display text-xl font-semibold">What are you thinking about?</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(changeMeta) as ChangeType[]).map((t) => {
          const m = changeMeta[t]
          const Icon = m.icon
          return (
            <button
              key={t}
              type="button"
              onClick={() => onPick(t)}
              className="group flex flex-col items-start rounded-2xl border border-line bg-surface p-6 text-left shadow-card transition hover:-translate-y-0.5 hover:border-navy hover:shadow-lift"
            >
              <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber transition-colors group-hover:bg-navy group-hover:text-white">
                <Icon size={22} aria-hidden />
              </span>
              <span className="font-display text-lg font-semibold">{m.title}</span>
              <span className="mt-1 text-sm leading-relaxed text-muted">{m.description}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy">
                Start <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
    return <Card className="p-8 text-center text-sm text-muted">Fill in every field to see the result.</Card>
  if (simulation.isPending) return <Spinner label="Calculating…" />

  return (
    <div className="space-y-4" aria-live="polite" aria-busy={simulation.isFetching}>
      {simulation.error && <ErrorNote error={simulation.error} />}
      {result && (
        <div className={simulation.isFetching || simulation.isError ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="space-y-4">
            <ResultHeadline result={result} caseKey="expected" />
            <KeyFacts result={caseOf(result, 'expected')} horizonMonths={result.horizonMonths} />
            <CashWarning result={result} />
            <Card className="p-5">
              <h3 className="font-display text-base font-semibold">Month by month (expected case)</h3>
              <p className="mb-3 text-xs text-muted">Bars: how each month compares with today. Line: the running total.</p>
              <ImpactChart result={caseOf(result, 'expected')} />
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
      <h3 className="font-display text-base font-semibold">Business map in month {horizonMonths}</h3>
      <p className="mb-4 text-xs text-muted">Highlighted boxes are changed by this plan (expected case).</p>
      <BusinessMap
        nodes={mapNodes(last, delta)}
        highlighted={highlightedFor(types)}
        resultTone={isNegative(last.monthlyResult) ? 'bad' : isNegative(delta) ? 'navy' : 'good'}
        capacityLimited={!isZero(last.unservedDemand)}
      />
    </Card>
  )
}
