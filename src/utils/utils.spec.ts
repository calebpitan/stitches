import { describe, it } from 'vitest'

import { getUpcomingRegualarSchedules } from './scheduling'
import { type datetime } from './utils'

describe('utils', () => {
  describe('#getUpcomingSchedules', () => {
    it('should generate', () => {
      const it = getUpcomingRegualarSchedules.iterator({
        id: '',
        taskId: '',
        frequency: {
          type: 'month',
          exprs: { every: 2, subexpr: { type: 'ondays', days: [10, 12, 13] } },
          until: new Date('2026-10-30T16:45:00.520Z'),
        },
        timing: {
          anchor: new Date('2024-10-20T16:45:00.520Z'),
          naive: '',
          tzone: '',
        },
      })
      let itr: IteratorResult<datetime.DateTime>
      let i = 0
      while ((itr = it.next()) && !itr.done && i < 100) {
        i++
        console.log('Value %s %s', i.toString().padStart(3, '0'), itr.value)
      }
    })
  })
})
