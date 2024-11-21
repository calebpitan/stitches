<script setup lang="ts">
import type { TaskSchedule } from '@stitches/common'

import { useLocale } from '@/composables/useLocale'

import IconLoopOff from '../icons/IconLoopOff.vue'
import IconLoopOn from '../icons/IconLoopOn.vue'
import HStack from '../stack/HStack.vue'

interface MgmtScheduleSummaryProps {
  schedule: TaskSchedule | null
}

withDefaults(defineProps<MgmtScheduleSummaryProps>(), {})

const locale = useLocale()
const freqTypeMap = {
  hour: 'hourly',
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
  year: 'yearly',
  custom: 'custom',
  get(key: Exclude<keyof typeof this, 'get'>) {
    return this[key]
  },
}
</script>

<template>
  <div class="s-mgmt-schedule-summary">
    <div v-if="schedule !== null && schedule.timestamp" class="s-mgmt-schedule-timestamp">
      <span>
        {{ schedule.timestamp.toLocaleDateString(locale, { dateStyle: 'long' }) }}
      </span>
      <span> &middot; </span>
      <span>
        {{ schedule.timestamp.toLocaleTimeString(locale, { timeStyle: 'short' }) }}
      </span>
    </div>
    <div v-else>You have not set a schedule for this task</div>

    <HStack v-if="schedule && schedule.frequency.type !== 'never'" :spacing="1">
      <IconLoopOn />
      <span>{{ freqTypeMap.get(schedule.frequency.type) }}</span>

      <template v-if="schedule.frequency.until">
        <IconLoopOff width="1.2em" height="1.2em" />
        <span>{{ schedule.frequency.until.toLocaleDateString(locale) }}</span>
      </template>
    </HStack>

    <div class="s-mgmt-schedule-summary-buttons">
      <slot name="edit-button" />
      <slot name="clear-button" />
    </div>
  </div>
</template>

<style scoped>
.s-mgmt-schedule-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.s-mgmt-schedule-summary-buttons {
  margin-inline-start: auto;
  display: inline-flex;
  gap: 1rem;
  align-items: center;

  & > * {
    text-decoration: underline;
  }
}
</style>
