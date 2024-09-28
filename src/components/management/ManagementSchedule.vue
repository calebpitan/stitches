<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'

import { SVG } from '@svgdotjs/svg.js'

import { usePrimaryColor } from '@/composables/usePrimaryColor'
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

interface ThreadNode {
  type: 'line' | 'circle'
  stroke: string
  strokeWidth: number
  fill?: string
}

interface CircleNode extends ThreadNode {
  type: 'circle'
  d: number
  x1: number
  y1: number
}

interface LineNode extends ThreadNode {
  type: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
}

interface ThreadConfig {
  width: number
  height: number
  viewbox(): [number, number, number, number]
  elements(): Array<CircleNode | LineNode>
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

const primaryColor = usePrimaryColor()

const thread = computed<ThreadConfig>(() => {
  return {
    width: 32,
    height: 48,
    viewbox() {
      return [0, 0, this.width, this.height] as const
    },
    elements() {
      const color = primaryColor.value
      const [l1x1, l1y1] = [0, 0] as const
      const [l1x2, l1y2] = [0, 16] as const
      const cd = 16
      const [cx1, cy1] = [-1 * (cd / 2), l1y2]
      const [l2x1, l2y1] = [0, l1y2 + cd] as const
      const [l2x2, l2y2] = [0, l1y2 * 2 + cd] as const

      return [
        {
          type: 'line',
          x1: l1x1,
          y1: l1y1,
          x2: l1x2,
          y2: l1y2,
          stroke: 'currentColor',
          strokeWidth: 2
        },
        {
          type: 'line',
          x1: -16 + cx1,
          y1: cd / 2 + l1y2,
          x2: cx1,
          y2: cd / 2 + l1y2,
          stroke: 'currentColor',
          strokeWidth: 2
        },
        {
          type: 'circle',
          x1: cx1,
          y1: cy1,
          d: cd,
          fill: 'none',
          stroke: color,
          strokeWidth: 2
        },
        {
          type: 'line',
          x1: l2x1,
          y1: l2y1,
          x2: l2x2,
          y2: l2y2,
          stroke: 'currentColor',
          strokeWidth: 2
        }
      ]
    }
  }
})

function drawThread(container: HTMLElement, config: ThreadConfig) {
  const draw = SVG()
  const group = draw.group()

  const elements = config.elements()

  const drawCircle = (element: CircleNode) => {
    return draw
      .circle(element.d)
      .move(element.x1, element.y1)
      .fill({ color: element.fill })
      .stroke({ width: element.strokeWidth, color: element.stroke })
  }

  const drawLine = (element: LineNode) => {
    return draw
      .line(element.x1, element.y1, element.x2, element.y2)
      .stroke({ width: element.strokeWidth, color: element.stroke })
  }

  draw
    .addTo(container)
    .size(config.width, config.height)
    .viewbox(...config.viewbox())

  elements.forEach((element) => {
    switch (element.type) {
      case 'circle':
        group.add(drawCircle(element))
        break
      case 'line':
        group.add(drawLine(element))
        break
      // no default
    }
  })

  group.transform({ translateX: config.width * 0.75 - 1 })

  return (): void => void draw.remove()
}

onMounted(() => {
  locale.value = navigator.language
  watch(thread, (t, __, onCleanup) => onCleanup(drawThread(threadline.value!, t)), {
    immediate: true
  })
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
    if (!timestamp) return
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

      <HStack
        v-if="datetime !== null"
        class="s-schedule-headline"
        style="align-items: center"
        :spacing="1"
      >
        <span class="s-schedule-headline-text">
          {{ datetime.toLocaleDateString(locale, { dateStyle: 'long' }) }}
        </span>
        <span class="s-schedule-headline-text">|</span>
        <span class="s-schedule-headline-text">
          {{ datetime.toLocaleTimeString(locale, { timeStyle: 'short' }) }}
        </span>

        <Button
          severity="danger"
          style="margin-inline-start: auto; font-size: 0.875rem; line-height: 1; border: 0"
          :text="true"
          :dt="{ padding: { x: '0.0625rem', y: '0.0625rem' } }"
          >Clear</Button
        >
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
  top: calc(24px - 0.5rem);
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
  width: 32px;
  position: relative;
  right: 2.25rem;
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
