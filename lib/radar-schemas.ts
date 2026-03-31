import { z } from 'zod'

export const RADAR_STORAGE_VERSION = 1

export const radarConfigSchema = z
  .object({
    weights: z.tuple([
      z.number().min(0).max(2),
      z.number().min(0).max(2),
      z.number().min(0).max(2),
    ]),
    posThresholds: z
      .tuple([z.number().int().min(1).max(19), z.number().int().min(2).max(20)])
      .superRefine(([first, second], ctx) => {
        if (first >= second) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Position thresholds must be ascending',
          })
        }
      }),
    scoreBands: z
      .tuple([
        z.number().min(0).max(1),
        z.number().min(0).max(1),
        z.number().min(0).max(1),
      ])
      .superRefine(([first, second, third], ctx) => {
        if (!(first < second && second < third)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Score bands must be ascending',
          })
        }
      }),
    expectedCTR: z
      .record(z.string(), z.number().positive().max(100))
      .superRefine((value, ctx) => {
        for (let index = 1; index <= 20; index += 1) {
          if (!(String(index) in value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Missing expected CTR for position ${index}`,
            })
          }
        }
      }),
  })
  .strict()

export const rawTermDataSchema = z.object({
  term: z.string().min(1),
  clicks: z.number().min(0),
  impressions: z.number().min(0),
  ctr: z.number().min(0).max(100),
  position: z.number().min(1).max(100),
})

export const radarSearchHistoryEntrySchema = z.object({
  id: z.string().min(1),
  query: z.string().min(1),
  selectedTerm: z.string().min(1).nullable().default(null),
  dataSourceId: z.string().min(1),
  createdAt: z.string().datetime(),
  interaction: z.enum(['query', 'selection']).default('selection'),
})

export const radarConfigSnapshotSchema = z.object({
  id: z.string().min(1),
  version: z.literal(RADAR_STORAGE_VERSION),
  label: z.string().min(1),
  createdAt: z.string().datetime(),
  selectedTerm: z.string().min(1).nullable().default(null),
  dataSourceId: z.string().min(1).nullable().default(null),
  config: radarConfigSchema,
})

export const radarDataSourceRecordSchema = z.object({
  id: z.string().min(1),
  version: z.literal(RADAR_STORAGE_VERSION),
  label: z.string().min(1),
  kind: z.enum(['embedded', 'imported']),
  createdAt: z.string().datetime(),
  recordCount: z.number().int().min(0),
  isActive: z.boolean().default(false),
  data: z.array(rawTermDataSchema),
  meta: z
    .object({
      filename: z.string().min(1).optional(),
      notes: z.string().min(1).optional(),
    })
    .default({}),
})

export const radarPersistenceStateSchema = z.object({
  version: z.literal(RADAR_STORAGE_VERSION),
  configSnapshots: z.array(radarConfigSnapshotSchema).default([]),
  searchHistory: z.array(radarSearchHistoryEntrySchema).default([]),
  dataSources: z.array(radarDataSourceRecordSchema).default([]),
  activeDataSourceId: z.string().min(1).nullable().default(null),
})

export type RadarConfigInput = z.infer<typeof radarConfigSchema>
export type RawTermDataInput = z.infer<typeof rawTermDataSchema>
export type RadarSearchHistoryEntry = z.infer<typeof radarSearchHistoryEntrySchema>
export type RadarConfigSnapshot = z.infer<typeof radarConfigSnapshotSchema>
export type RadarDataSourceRecord = z.infer<typeof radarDataSourceRecordSchema>
export type RadarPersistenceState = z.infer<typeof radarPersistenceStateSchema>
