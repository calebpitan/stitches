<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue'

import { $dt } from '@primevue/themes'
import { SVG } from '@svgdotjs/svg.js'
import { usePreferredDark } from '@vueuse/core'

import type { BaseTaskSchedule, Frequency, TaskSchedule } from '@/interfaces/schedule'
import { frequencies } from '@/utils/scheduling'

import CronScheduler from '../repeatables/CronScheduler.vue'
import HStack from '../stack/HStack.vue'
import VStack from '../stack/VStack.vue'

interface ManagementScheduleProps {
  taskId: string
  schedule: TaskSchedule | null
  onSchedule?: (schedule: BaseTaskSchedule | TaskSchedule) => void
}

const props = withDefaults(defineProps<ManagementScheduleProps>(), {})

const threadline = ref<HTMLDivElement | null>(null)

const locale = ref('en-GB')
const datetime = ref<Date | null>(props.schedule?.timestamp ?? null)
const frequency = ref<Frequency>({
  type: props.schedule?.frequency.type ?? 'never',
  until: props.schedule?.frequency.until ?? null,
  crons: props.schedule?.frequency.type === 'custom' ? props.schedule.frequency.crons : []
})

const isDark = usePreferredDark({ window: window })

function drawThread(container: HTMLElement) {
  const fontSize = parseInt(getComputedStyle(document.documentElement).fontSize)
  const draw = SVG()
  const group = draw.group()
  const [width, height] = [300, 100]

  draw.addTo(container).size(width, height).viewbox(0, 0, width, height)

  // Create threadline (timeline)
  const line1 = draw.line(0, 0, 0, 50).stroke({ width: 2, color: 'currentColor' })

  // Create node points (events on timeline)
  const nodeColor = $dt('primary.color').value[isDark.value ? 'dark' : 'light'].value
  const node1 = draw
    .circle(15)
    .fill('none')
    .stroke({ width: 2, color: nodeColor })
    .move(-15 / 2, 50)

  const line2 = draw.line(0, 50 + 15, 0, 50 + 15 + 50).stroke({ width: 2, color: 'currentColor' })

  group
    .add(line1)
    .add(node1)
    .add(line2)
    .transform({ translateX: width - 2.25 * fontSize })

  return (): void => void draw.remove()
}

onMounted(() => {
  locale.value = navigator.language
  watch(isDark, (_, __, onCleanup) => onCleanup(drawThread(threadline.value!)), { immediate: true })
})

watchEffect(() => {
  if (frequency.value.type !== 'custom') {
    // @ts-expect-error
    frequency.value = { ...frequency.value, crons: [] }
  }
})

watch(
  [datetime, frequency],
  ([timestamp, freq]) => {
    props.onSchedule?.({
      id: props.schedule?.id,
      taskId: props.taskId,
      frequency: freq,
      timestamp: timestamp
    })
  },
  { deep: true }
)
</script>

<template>
  <div class="s-management-schedule">
    <div class="s-schedule-header">
      <div ref="threadline" class="s-threadline" />

      <HStack v-if="datetime !== null" class="s-schedule-headline" :spacing="1">
        <span class="s-schedule-headline-text">
          {{ datetime.toLocaleDateString(locale, { dateStyle: 'long' }) }}
        </span>
        |
        <span class="s-schedule-headline-text">
          {{ datetime.toLocaleTimeString(locale, { timeStyle: 'short' }) }}
        </span>
      </HStack>
    </div>

    <div class="s-management-scheduler">
      <HStack class="s-management-scheduler-stack" :spacing="4">
        <DatePicker
          v-model="datetime"
          class="s-datepicker"
          panel-class="s-datepicker-panel"
          date-format="dd/mm/yy"
          :inline="true"
          :show-time="true"
        />

        <VStack :spacing="4">
          <HStack :spacing="4" style="margin-top: 1rem">
            <FloatLabel>
              <Select
                id="s-schedule-repeat"
                class="s-select"
                dropdown-icon="pi pi-angle-down"
                label-class="s-select-label"
                overlay-class="s-select-overlay"
                v-model="frequency.type"
                :options="frequencies"
                :option-group-label="'group'"
                :option-group-children="'items'"
                :option-label="'label'"
                :option-value="'value'"
              >
                <template #optiongroup="{ option }">
                  <Divider v-if="option.group === 'custom'" style="margin: 0" />
                  <span v-else aria-hidden="true" />
                </template>
              </Select>
              <label for="s-schedule-repeat" class="s-label">Repeat</label>
            </FloatLabel>

            <FloatLabel v-if="frequency.type !== 'never'">
              <DatePicker
                id="s-schedule-repeat-until"
                v-model="frequency.until"
                class="s-datepicker"
                input-class="s-datepicker-input"
                panel-class="s-datepicker-panel"
                date-format="dd/mm/yy"
                :inline="false"
              />
              <label for="s-schedule-repeat-until" class="s-label"> Until </label>
            </FloatLabel>
          </HStack>

          <CronScheduler
            v-if="frequency.type === 'custom'"
            :locale="locale"
            :timestamp="datetime"
            :crons="frequency.crons"
            @change="frequency.crons = $event"
          />
        </VStack>
      </HStack>
    </div>
  </div>
</template>

<style scoped>
.s-schedule-header {
  position: relative;
}

.s-schedule-headline {
  position: absolute;
  top: calc(57.5px - 0.5rem);
  line-height: 1;
  margin-inline-start: 1rem;
}

.s-schedule-headline-text {
  --s-threadline-color-alpha: 1;
  font-weight: 300;
  color: rgba(var(--s-threadline-color-rgb) / var(--s-threadline-color-alpha));
  color: var(--p-primary-color);
}

.s-threadline {
  width: 300px;
  position: relative;
  margin-inline-start: auto;
  margin-block: 0.5rem;
  color: var(--s-threadline-color);
  display: flex;
  justify-content: center;
}

.s-management-schedule {
  position: relative;
  width: 100%;
  --s-threadline-color-alpha: 0.3;
  --s-threadline-color-rgb: var(--s-primary-color-rgb);
  --s-threadline-color: rgba(var(--s-threadline-color-rgb) / var(--s-threadline-color-alpha));
}

.s-management-scheduler {
  justify-content: flex-end;
}

.s-management-scheduler-stack {
  position: relative;
  padding: 1rem;
}

.s-management-scheduler-stack::after {
  content: '';
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  position: absolute;
  border-radius: 1rem;
  pointer-events: none;
  border: 1px solid rgba(var(--s-primary-color-rgb) / 0.3);
  background-color: rgba(var(--s-primary-color-rgb) / 0.05);
}

.s-schedule-heading {
  font-size: 1rem;
  font-weight: 500;
  display: block;
  transform: rotateY(-25deg) skewY(-4deg);
}
</style>

<style>
.p-datepicker.s-datepicker {
  width: auto;
}

.p-datepicker-panel.s-datepicker-panel {
  border: 0;
  font-size: 0.875rem;
}

.p-datepicker-panel.s-datepicker-panel .p-datepicker-day-view,
.p-datepicker-panel.s-datepicker-panel .p-datepicker-time-picker span {
  font-size: 0.75rem;
}

.p-datepicker-panel.s-datepicker-panel .p-datepicker-day-view th,
.p-datepicker-panel.s-datepicker-panel .p-datepicker-day-view td {
  padding: 0.125rem;
}

.p-datepicker-panel.s-datepicker-panel .p-datepicker-day-view td > span {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
