import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

/**
 * Typed API client. Types come from the API's OpenAPI document: run `npm run gen:api` after the API changes.
 * Requests are same-origin (Vite proxies /api in development) and carry the HTTP-only session cookie.
 */
export const api = createClient<paths>({ credentials: 'include' })

export type Schemas = components['schemas']
export type BusinessDto = Schemas['BusinessDto']
export type BaselineDto = Schemas['BaselineDto']
export type BaselineInput = Schemas['BaselineInput']
export type BaselineSummaryDto = Schemas['BaselineSummaryDto']
export type SourceLabel = Schemas['SourceLabel']
export type ChangeDto = Schemas['ChangeDto']
export type ChangeType = Schemas['ChangeType']
export type EstimateDto = Schemas['EstimateDto']
export type ScenarioDto = Schemas['ScenarioDto']
export type SaveScenarioRequest = Schemas['SaveScenarioRequest']
export type SimulationResultDto = Schemas['SimulationResultDto']
export type CaseResultDto = Schemas['CaseResultDto']
export type CaseKey = Schemas['Case']
export type MonthResultDto = Schemas['MonthResultDto']
export type WaterfallStepDto = Schemas['WaterfallStepDto']

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Unwraps an openapi-fetch result: returns data, null on 404, and throws ApiError otherwise. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T | null {
  if (result.response.status === 404) return null
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(result.response.status, problemMessage(result.error) ?? result.response.statusText)
  }
  return result.data as T
}

/** Like unwrap, but a 404 is an error too. */
export function must<T>(result: { data?: T; error?: unknown; response: Response }): T {
  const data = unwrap(result)
  if (data === null) throw new ApiError(404, 'Not found.')
  return data
}

function problemMessage(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const p = error as { detail?: string; title?: string; errors?: Record<string, string[]> }
    if (p.errors) return Object.values(p.errors).flat().join(' ')
    return p.detail ?? p.title
  }
  return undefined
}
