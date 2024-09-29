<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { CronCore } from '@vue-js-cron/core'

import cronstrue from 'cronstrue'

import type { CronSchedule } from '@/interfaces/schedule'
import { timeToParts } from '@/utils'
import type { FrequencyType } from '@/utils/scheduling'

import HStack from '../stack/HStack.vue'

export interface CronSchedulerProps {
  timestamp: Date | null
  locale: string
  crons: CronSchedule[]
  onChange?(schedules: CronSchedule[]): void
}

const props = withDefaults(defineProps<CronSchedulerProps>(), {})

const tm = computed(() => props && timeToParts(props.timestamp ?? new Date()))
const config = computed(() => {
  const time = tm.value
  return {
    year: [time.minute, time.hour, time.date, time.month, '*'],
    month: [time.minute, time.hour, time.date, '*', '*'],
    week: [time.minute, time.hour, '*', '*', time.weekday],
    day: [time.minute, time.hour, '*', '*', '*'],
    hour: [time.minute, '*', '*', '*', '*'],
    minute: ['*', '*', '*', '*', '*']
  } as const
})

const defaultCrons: CronSchedule[] = [{ expression: config.value.day.join(' '), frequency: 'day' }]
const schedules = ref<CronSchedule[]>(props.crons.length > 0 ? props.crons : defaultCrons)

const impressions = computed(() => schedules.value.map((s) => cronstrue.toString(s.expression)))

const maxSchedules = 3

watch(schedules, (s) => props.onChange?.(s), { deep: true })
</script>

<template>
  <div class="s-cron-scheduler">
    <TransitionGroup name="schedule">
      <div
        class="s-cron-scheduler-inner"
        v-for="(schedule, index) in schedules"
        :key="index"
        :data-machine-expression="schedule.expression"
        :data-human-impression="impressions[index]"
      >
        <div class="s-cron-human-impression">{{ impressions[index] }}</div>

        <CronCore
          v-slot="{ fields, period }"
          v-model="schedule.expression"
          :period="schedule.frequency"
        >
          <HStack :spacing="1" style="flex-wrap: wrap; justify-content: flex-start">
            <HStack :spacing="1" style="align-items: center">
              <label :for="`cron-scheduler-${period.prefix}`" class="s-label">
                {{ period.prefix }}
              </label>

              <Select
                class="s-select"
                dropdown-icon="pi pi-angle-down"
                label-class="s-select-label"
                overlay-class="s-select-overlay"
                :id="`cron-scheduler-${period.prefix}`"
                :model-value="period.attrs.modelValue"
                :options="period.items"
                :option-label="'text'"
                :option-value="'id'"
                :option-disabled="(data) => data.id === 'minute'"
                @change="
                  ([schedule.frequency, schedule.expression] = [
                    $event.value,
                    config[$event.value as Exclude<FrequencyType, 'custom' | 'never'>].join(' ')
                  ]),
                    period.events['update:model-value']($event.value)
                "
              />
            </HStack>

            {{ period.suffix }}

            <template v-for="f in fields" :key="f.id">
              <HStack :spacing="1" style="align-items: center">
                <label :for="`cron-scheduler-${f.id}`" class="s-label"> {{ f.prefix }}</label>

                <MultiSelect
                  class="s-select"
                  dropdown-icon="pi pi-angle-down"
                  overlay-class="s-select-overlay"
                  :id="`cron-scheduler-${f.id}`"
                  :placeholder="f.selectedStr"
                  :model-value="f.attrs.modelValue"
                  :options="f.items"
                  :option-label="'text'"
                  :option-value="'value'"
                  :show-toggle-all="true"
                  @change="f.events['update:model-value']($event.value)"
                >
                  <template #value>
                    <span>{{ f.selectedStr }}</span>
                  </template>
                </MultiSelect>

                <span v-if="f.suffix" class="s-label">{{ f.suffix }}</span>
              </HStack>
            </template>
          </HStack>
        </CronCore>

        <Button
          v-if="index < maxSchedules - 1"
          class="s-cron-scheduler-add"
          type="button"
          :aria-label="index === schedules.length - 1 ? 'Add' : 'Remove'"
          :icon="index === schedules.length - 1 ? 'pi pi-plus' : 'pi pi-minus'"
          :rounded="true"
          @click="
            index === schedules.length - 1
              ? schedules.push({ expression: config.minute.join(' '), frequency: 'day' })
              : void schedules.splice(index + 1, 1)
          "
        />
      </div>
    </TransitionGroup>

    <span v-if="schedules.length < maxSchedules" class="s-scheduler-inner-offset" />
  </div>
</template>

<style scoped>
.s-cron-scheduler {
  position: relative;
  --p-button-icon-only-width: 0.875rem;
  --scheduler-inner-thread-height: 50px;
  --scheduler-inner-thread-width: 2px;
  --scheduler-inner-padding: 1rem;
  --factor: 1.5;

  & > * + * {
    margin-top: calc(var(--scheduler-inner-thread-height) / var(--factor));
  }
}

.s-scheduler-inner-offset {
  margin-bottom: var(--scheduler-inner-thread-height);
  display: block;
}

.s-cron-scheduler-inner {
  padding: var(--scheduler-inner-padding);
  position: relative;

  /* For every schedule that is not having a lower sibling of the same type */
  /* not(:has(+ &)) === :last-of-type */
  &:last-of-type::before {
    bottom: calc(-1 * var(--scheduler-inner-thread-height));
    height: var(--scheduler-inner-thread-height);
  }

  /* For every schedule that isn't the last of its type */
  &:not(:last-of-type)::before {
    bottom: calc(-1 * var(--scheduler-inner-thread-height) / var(--factor));
    height: calc(var(--scheduler-inner-thread-height) / var(--factor));
  }

  /* Max schedules we can have is three, so when at the third, no more thread */
  &:not(:nth-of-type(3))::before {
    content: '';
    left: var(--scheduler-inner-padding);
    position: absolute;
    width: var(--scheduler-inner-thread-width);
    background-color: rgba(var(--s-primary-color-rgb) / 0.3);
  }

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

  &:not(:last-of-type) .s-cron-scheduler-add {
    bottom: calc(
      -1 * ((
              (var(--scheduler-inner-thread-height) / var(--factor)) +
                var(--p-button-icon-only-width)
            ) / 2)
    );
  }

  &:last-of-type .s-cron-scheduler-add {
    bottom: calc(
      -1 * ((var(--scheduler-inner-thread-height) + var(--p-button-icon-only-width)) / 2)
    );
  }
}

.s-cron-scheduler-add {
  --p-icon-size: 0.75rem;
  position: absolute !important;
  padding: 0;
  left: calc(
    var(--scheduler-inner-padding) - ((var(--p-button-icon-only-width)) / 2) +
      (var(--scheduler-inner-thread-width) / 2)
  );
}

.s-cron-human-impression {
  color: var(--p-primary-color);
  font-size: 0.75rem;
  position: relative;
  margin-block-end: 1em;
}

.s-select {
  width: fit-content;
  max-width: 150px;
}

.s-label {
  font-size: 0.875rem;
  color: var(--s-script-secondary);
}

/* TRANSITIONS */
.schedule-enter-from,
.schedule-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.schedule-enter-active,
.schedule-leave-active {
  z-index: 0;
}

.schedule-move,
.schedule-enter-active,
.schedule-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.4s ease;
}

.schedule-leave-active {
  position: absolute;
}
</style>

<style>
ul#cron-scheduler-hour_list.p-multiselect-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

ul#cron-scheduler-minute_list.p-multiselect-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}
</style>
