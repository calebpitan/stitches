<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

import type { SelectButtonChangeEvent } from 'primevue/selectbutton'

import type { YearlyExpr } from '@/interfaces/schedule'
import { evaluate, plural } from '@/utils'
import {
  MONTH_OPTIONS,
  ORDINAL_OPTIONS_GROUP,
  type Ordinals,
  WEEKDAY_OPTIONS_GROUP,
  type WeekdayVariable
} from '@/utils/scheduling'

import Stack from '../stack/Stack.vue'

export interface YearlySchedulerProps {
  timestamp: Date | null
  expression?: YearlyExpr
  onExpressionChange: (expression: YearlyExpr) => void
}

type UpdateData = {
  year: number
  months: number[]
  weekday: number | WeekdayVariable
  ordinal: Ordinals
  weekdayRelActive: boolean
}

const props = withDefaults(defineProps<YearlySchedulerProps>(), {
  expression: (props) => {
    return {
      every: 1,
      subexpr: {
        in: {
          months: [(props.timestamp ?? new Date()).getMonth()]
        }
      }
    }
  }
})

const ids = { year: useId(), months: useId(), rel: useId() }

const year = ref(props.expression.every)
const months = ref<Array<number>>(evaluate(() => props.expression.subexpr.in.months))
const weekday = ref<number | WeekdayVariable>(
  evaluate(() => {
    const { subexpr } = props.expression
    return subexpr.on?.weekday || subexpr.on?.variable || 0
  })
)
const ordinal = ref(evaluate(() => props.expression.subexpr.on?.ordinal ?? 'first'))
const weekdayRelActive = ref(evaluate(() => !!props.expression.subexpr.on))

const weekdayOptionsGroup = computed(() => WEEKDAY_OPTIONS_GROUP.slice())
const monthOptions = computed(() => MONTH_OPTIONS.slice())
const ordinalOptionsGroup = computed(() => ORDINAL_OPTIONS_GROUP.slice())

function handleMonthChange(evt: SelectButtonChangeEvent) {
  const value = evt.value as typeof months.value
  // Ensure months can't be an empty array
  if (months.value.length === 1 && value.length === 0) return
  if (value.length === 0) return
  months.value = value
}

function update(data: UpdateData) {
  const expr: YearlyExpr = { every: data.year, subexpr: { in: { months: data.months } } }

  if (data.weekdayRelActive) {
    expr.subexpr.on = {
      ordinal: data.ordinal,
      weekday: typeof data.weekday === 'number' ? data.weekday : undefined,
      variable: typeof data.weekday === 'string' ? data.weekday : undefined
    }
  }

  props.onExpressionChange(expr)
}

watch([year, months, weekday, ordinal, weekdayRelActive], (args) => {
  const [year, months, weekday, ordinal, weekdayRelActive] = args

  update({ year, months, ordinal, weekday, weekdayRelActive })
})
</script>

<template>
  <div class="s-monthly-scheduler">
    <Stack type="vstack" :spacing="2">
      <Stack type="hstack" :spacing="4">
        <span class="s-label">Every</span>

        <InputNumber
          v-model="year"
          class="s-inputwrapper"
          input-class="s-inputtext"
          :input-id="ids.year"
          :min="1"
          :max="200"
          :allow-empty="false"
          :show-buttons="true"
          button-layout="stacked"
          style="width: 6rem; font-size: 0.875rem"
          :input-style="{ width: '100%', 'font-size': '0.875rem' }"
        />

        <label :for="ids.year" class="s-label">
          {{ plural(year, 'Year', 'Years') }}
        </label>
      </Stack>

      <Stack type="vstack" :spacing="0" style="width: 100%; align-items: center">
        <span :id="ids.months" class="s-label" style="align-self: self-start">in</span>
        <SelectButton
          class="s-selectbutton grided"
          data-grid-col="4"
          :aria-labelledby="ids.months"
          :model-value="months"
          :multiple="true"
          :options="monthOptions"
          option-label="alt"
          option-value="value"
          @change="handleMonthChange"
        />
      </Stack>

      <Stack type="vstack" :spacing="1">
        <Stack type="hstack" :spacing="1">
          <Checkbox
            v-model="weekdayRelActive"
            class="s-checkbox"
            data-s-wkrel
            :input-id="ids.rel"
            :binary="true"
          />
          <label :for="ids.rel" class="s-label">On The</label>
        </Stack>

        <Stack type="hstack" :spacing="2">
          <Select
            v-model="ordinal"
            class="s-select"
            dropdown-icon="pi pi-angle-down"
            label-class="s-select-label"
            overlay-class="s-select-overlay"
            :disabled="!weekdayRelActive"
            :options="ordinalOptionsGroup"
            option-label="alt"
            option-value="value"
            option-group-label="group"
            option-group-children="items"
          >
            <template #optiongroup="{ option }">
              <Divider v-if="option.group === 'others'" style="margin: 0" />
              <span v-else aria-hidden="true" />
            </template>
          </Select>

          <Select
            v-model="weekday"
            class="s-select"
            dropdown-icon="pi pi-angle-down"
            label-class="s-select-label"
            overlay-class="s-select-overlay"
            :disabled="!weekdayRelActive"
            :options="weekdayOptionsGroup"
            option-group-label="group"
            option-group-children="items"
            option-label="alt"
            option-value="value"
          >
            <template #optiongroup="{ option }">
              <Divider v-if="option.group === 'variable'" style="margin: 0" />
              <span v-else aria-hidden="true" />
            </template>
          </Select>
        </Stack>
      </Stack>
    </Stack>
  </div>
</template>

<style scoped>
.s-monthly-scheduler {
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

.s-selectbutton {
  &.grided {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
}

.s-checkbox {
  --p-checkbox-width: 1em;
  --p-checkbox-height: 1em;

  & svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}

.s-label {
  font-size: 0.875rem;
  color: var(--s-script-secondary);
}
</style>

<style>
.s-selectbutton[data-grid-col='4'].grided {
  & > .p-togglebutton {
    border-width: 0 0 1px 1px;

    &:first-child {
      border-bottom-left-radius: 0;
    }

    &:nth-child(4n) {
      border-right-width: 1px;
    }

    /* The 1st through to 4th child */
    &:nth-child(n + 1):nth-child(-n + 4) {
      border-top-width: 1px;
    }

    &:last-child {
      border-top-right-radius: 0;
      border-right-width: 1px;
    }
  }
}
</style>
