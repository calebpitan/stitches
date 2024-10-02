<script setup lang="ts">
import type { TaskSchedule } from '@/interfaces/schedule'

import MgmtScheduleSummary from './MgmtScheduleSummary.vue'

interface MgmtScheduleSummaryProps {
  schedule: TaskSchedule | null
}

withDefaults(defineProps<MgmtScheduleSummaryProps>(), {})
</script>

<template>
  <div class="s-mgmt-schedule-info">
    <div class="s-mgmt-schedule-info-inner">
      <div class="s-mgmt-schedule-info-title">Schedule</div>
      <div>
        <MgmtScheduleSummary :schedule="schedule">
          <template #edit-button>
            <slot name="edit-button" />
          </template>

          <template #clear-button>
            <slot name="clear-button" />
          </template>
        </MgmtScheduleSummary>
      </div>
    </div>
  </div>
</template>

<style scoped>
.s-mgmt-schedule-info {
  padding: 0rem;
  border: 1px dashed rgba(var(--s-primary-color-rgb) / var(--p-primary-color-alpha, 0.5));
  background: rgba(var(--s-primary-color-rgb) / var(--p-primary-color-alpha, 1));
  color: var(--p-primary-contrast-color);
  border-radius: var(--p-card-border-radius);
  overflow: hidden;
}

.s-mgmt-schedule-info-inner {
  padding: 2rem;
}

.s-mgmt-schedule-info-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-block-end: 1rem;
  line-height: 1;
}

.s-mgmt-schedule-summary {
  color: rgb(from var(--p-primary-contrast-color) r g b / 0.7);
}
</style>
