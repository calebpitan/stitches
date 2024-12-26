import { BitMask, type TaskSchedule, never } from '@stitches/common'
import type { schedule, task } from '@stitches/io'

import type { TaskListItem } from '@/interfaces/task'

export abstract class ObjectAdapter {
  static toTaskListItem(task: task.Task): TaskListItem {
    return {
      id: task.id,
      title: task.title,
      summary: task.summary,
      addedAt: task.createdAt,
      completedAt: null,
      tagIds: [],
    }
  }

  static toTaskSchedule(schedule: schedule.ScheduleUnion): TaskSchedule {
    const result: TaskSchedule = {
      id: schedule.id,
      taskId: schedule.taskId,
      timing: {
        anchor: schedule.anchoredAt,
        naive: schedule.naiveAnchoredAt,
        tzone: schedule.timezone
      },
      frequency: { type: 'never' },
    }

    if (!('frequencyType' in schedule)) return result

    if (schedule.frequencyType === 'custom') {
      result.frequency = {
        type: schedule.frequencyType,
        until: schedule.until,
        crons: schedule.frequency.map((f) => ({
          expression: f.expression,
          frequency: f.unit ?? 'never',
        })),
      }
      return result
    }

    switch (schedule.frequency.unit) {
      case 'hour':
      case 'day':
        result.frequency = {
          type: schedule.frequency.unit,
          until: schedule.until,
          exprs: { every: schedule.frequency.every },
        }
        break
      case 'week':
        result.frequency = {
          type: schedule.frequency.unit,
          until: schedule.until,
          exprs: {
            every: schedule.frequency.every,
            subexpr: {
              weekdays: BitMask.fromBits(schedule.frequency.exprs.weekdays, 7).toPositions(),
            },
          },
        }
        break
      case 'month':
        result.frequency = {
          type: schedule.frequency.unit,
          until: schedule.until,
          exprs: {
            every: schedule.frequency.every,
            get subexpr() {
              const frequency = schedule.frequency as schedule.Expression<
                'month',
                schedule.MonthlyExpression
              >
              if (frequency.exprs.type === 'ondays') {
                return {
                  type: frequency.exprs.type,
                  days: BitMask.fromBits(frequency.exprs.subexpr.days, 31).toPositions(),
                }
              }

              return {
                type: frequency.exprs.type,
                ordinal: frequency.exprs.subexpr.ordinal,
                weekday: frequency.exprs.subexpr.weekday,
              }
            },
          },
        }
        break
      case 'year':
        result.frequency = {
          type: schedule.frequency.unit,
          until: schedule.until,
          exprs: {
            every: schedule.frequency.every,
            subexpr: {
              in: {
                months: BitMask.fromBits(schedule.frequency.exprs.months, 12).toPositions(),
              },
              get on() {
                const frequency = schedule.frequency as schedule.Expression<
                  'year',
                  schedule.YearlyExpression
                >
                if (!frequency.exprs.on) return undefined
                return {
                  ordinal: frequency.exprs.on.ordinal,
                  weekday:
                    'constant' in frequency.exprs.on.weekday
                      ? frequency.exprs.on.weekday.constant
                      : undefined,
                  variable:
                    'variable' in frequency.exprs.on.weekday
                      ? frequency.exprs.on.weekday.variable
                      : undefined,
                }
              },
            },
          },
        }
        break
      default:
        never(schedule.frequency)
    }

    return result
  }
}
