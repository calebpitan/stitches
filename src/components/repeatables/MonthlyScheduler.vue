<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

import type { MonthlyExpr } from '@/interfaces/schedule'
import { evaluate, plural, range } from '@/utils'
import { ORDINAL_OPTIONS_GROUP, type Ordinals, WEEKDAY_OPTIONS } from '@/utils/scheduling'

import Stack from '../stack/Stack.vue'

/** Relationship */
type Rel = 'On Days' | 'On The'

export interface MonthlySchedulerProps {
  timestamp: Date | null
  expression?: MonthlyExpr
  onExpressionChange: (expression: MonthlyExpr) => void
}

type UpdateData = { month: number; days: string[]; weekday: number; ordinal: Ordinals; rel: Rel }

const props = withDefaults(defineProps<MonthlySchedulerProps>(), {
  expression: (props) => {
    return {
      every: 1,
      subexpr: { days: [(props.timestamp ?? new Date()).getDate()], type: 'ondays' }
    }
  }
})

const ids = { months: useId() }

const month = ref(props.expression.every)

const days = ref<Array<string>>(
  evaluate(() => {
    const type = props.expression.subexpr.type
    if (type === 'ondays') {
      return props.expression.subexpr.days.map((d) => d.toString())
    }
    return []
  })
)

const weekday = ref(
  evaluate(() => {
    const type = props.expression.subexpr.type
    if (type === 'onthe') return props.expression.subexpr.weekday
    return 0
  })
)

const ordinal = ref<Lowercase<Ordinals>>(
  evaluate(() => {
    const type = props.expression.subexpr.type
    if (type === 'onthe') return props.expression.subexpr.ordinal
    return 'first'
  })
)

const rel = ref<Rel>(
  evaluate(() => {
    const type = props.expression.subexpr.type
    return type === 'ondays' ? 'On Days' : 'On The'
  })
)

const dayOptions = computed(() => Array.from(range(1, 32)).map((d) => d.toString()))
const relOptions = computed((): Array<Rel> => ['On Days', 'On The'])
const weekdayOptions = computed(() => WEEKDAY_OPTIONS.slice())
const ordinalOptionsGroup = computed(() => ORDINAL_OPTIONS_GROUP.slice())

function update(data: UpdateData) {
  const expr: MonthlyExpr = { every: data.month, subexpr: undefined! }

  if (data.rel === 'On Days') {
    expr.subexpr = { type: 'ondays', days: data.days.map((d) => Number(d)) }
  } else {
    expr.subexpr = { type: 'onthe', ordinal: data.ordinal, weekday: data.weekday }
  }

  props.onExpressionChange(expr)
}

watch([month, days, weekday, ordinal, rel], (args) => {
  const [month, days, weekday, ordinal, rel] = args
  update({ month, days, weekday, ordinal, rel })
})
</script>

<template>
  <div class="s-monthly-scheduler">
    <Stack type="vstack" :spacing="2">
      <Stack type="hstack" :spacing="4">
        <span class="s-label">Every</span>

        <InputNumber
          v-model="month"
          class="s-inputwrapper"
          :input-id="ids.months"
          input-class="s-inputtext"
          :min="1"
          :max="200"
          :allow-empty="false"
          :show-buttons="true"
          button-layout="stacked"
          style="width: 6rem; font-size: 0.875rem"
          :input-style="{ width: '100%', 'font-size': '0.875rem' }"
        />

        <label :for="ids.months" class="s-label">
          {{ plural(month, 'Month', 'Months') }}
        </label>
      </Stack>

      <Stack type="vstack" :spacing="2" style="width: 100%">
        <SelectButton
          v-model="rel"
          class="s-selectbutton"
          style="margin-inline: auto"
          :options="relOptions"
        />

        <Stack v-if="rel === 'On Days'" type="vstack" :spacing="2" style="margin-inline: auto">
          <SelectButton
            v-model="days"
            data-grid-col="7"
            class="s-selectbutton smaller grided"
            :multiple="true"
            :options="dayOptions"
          />
        </Stack>

        <Stack v-if="rel === 'On The'" type="hstack" :spacing="2">
          <Select
            v-model="ordinal"
            class="s-select"
            dropdown-icon="pi pi-angle-down"
            label-class="s-select-label"
            overlay-class="s-select-overlay"
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
            :options="weekdayOptions"
            option-label="alt"
            option-value="value"
          />
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
  &.smaller {
    --p-togglebutton-padding: 0.375rem 0.5rem;
  }

  &.grided {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
}

.s-label {
  font-size: 0.875rem;
  color: var(--s-script-secondary);
}
</style>

<style>
.s-selectbutton[data-grid-col='7'].grided {
  & > .p-togglebutton {
    border-width: 0 0 1px 1px;

    &:first-child {
      border-bottom-left-radius: 0;
    }

    &:nth-child(7n) {
      border-right-width: 1px;
    }

    /* The 1st through to 7th child */
    &:nth-child(n + 1):nth-child(-n + 7) {
      border-top-width: 1px;
    }

    &:last-child {
      border-top-right-radius: 0;
      border-right-width: 1px;
    }
  }
}
</style>
