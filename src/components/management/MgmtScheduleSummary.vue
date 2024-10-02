<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import type { TaskSchedule } from '@/interfaces/schedule'

import LoopOff from '../icons/LoopOff.vue'
import LoopOn from '../icons/LoopOn.vue'
import HStack from '../stack/HStack.vue'

interface MgmtScheduleSummaryProps {
  schedule: TaskSchedule | null
}

withDefaults(defineProps<MgmtScheduleSummaryProps>(), {})

const locale = useLocale()
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
      <LoopOn />
      <span>{{ schedule.frequency.type }}</span>

      <template v-if="schedule.frequency.until !== null">
        <LoopOff width="1.2em" height="1.2em" />
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
