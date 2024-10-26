<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { WeeklyExpr } from '@/interfaces/schedule'
import { WEEKDAY_OPTIONS, plural } from '@/utils'

import Stack from '../stack/Stack.vue'

export interface WeeklySchedulerProps {
  timestamp: Date | null
  expression?: WeeklyExpr
  onExpressionChange: (expr: WeeklyExpr) => void
}

type UpdateData = { week: number; weekdays: number[] }

const props = withDefaults(defineProps<WeeklySchedulerProps>(), {
  expression: (props) => {
    return {
      every: 1,
      subexpr: { weekdays: [(props.timestamp ?? new Date()).getDay()] }
    }
  }
})

const week = ref(props.expression.every)
const weekdays = ref<Array<number>>(props.expression.subexpr.weekdays)

const weekdayOptions = computed(() => WEEKDAY_OPTIONS.slice())

function update(data: UpdateData) {
  const expr: WeeklyExpr = { every: data.week, subexpr: { weekdays: data.weekdays } }

  props.onExpressionChange(expr)
}

watch([week, weekdays], (args) => {
  const [week, weekdays] = args

  update({ week, weekdays })
})
</script>

<template>
  <div class="s-weekly-scheduler">
    <Stack type="vstack" :spacing="2">
      <Stack type="hstack" :spacing="4">
        <span class="s-label">Every</span>

        <InputNumber
          v-model="week"
          id="wkly-scheduler-no-of-wks"
          class="s-inputwrapper"
          input-class="s-inputtext"
          :min="1"
          :max="200"
          :allow-empty="false"
          :show-buttons="true"
          button-layout="stacked"
          style="width: 6rem; font-size: 0.875rem"
          :input-style="{ width: '100%', 'font-size': '0.875rem' }"
        />

        <label for="wkly-scheduler-no-of-wks" class="s-label">
          {{ plural(week, 'Week', 'Weeks') }}
        </label>
      </Stack>

      <Stack type="hstack" :spacing="4">
        <label for="wkly-scheduler-wk-dys" class="s-label">On</label>

        <SelectButton
          v-model="weekdays"
          id="wkly-scheduler-wk-dys"
          class="s-selectbutton"
          :multiple="true"
          :options="weekdayOptions"
          option-label="alt"
          option-value="value"
        />
      </Stack>
    </Stack>
  </div>
</template>

<style scoped>
.s-weekly-scheduler {
  --scheduler-inner-padding: 1rem;

  position: relative;
  padding: var(--scheduler-inner-padding);
  width: 100%;

  &::after {
    content: '';
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
    position: absolute;
    border-radius: 0.6875rem;
    pointer-events: none;
    border: 1px solid rgba(var(--s-primary-color-rgb) / 0.3);
    background-color: rgba(var(--s-primary-color-rgb) / 0.025);
  }
}

.s-label {
  font-size: 0.875rem;
  color: var(--s-script-secondary);
}
</style>
