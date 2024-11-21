<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { useScroll } from '@vueuse/core'

type Tracker = 'top' | 'right' | 'bottom' | 'left'

interface OverflowBoxProps {
  fadeColor?: string
}

withDefaults(defineProps<OverflowBoxProps>(), {})

const box = ref<HTMLDivElement | null>(null)
const tracker = ref<Set<Tracker>>(new Set())
const child = computed(() => box.value?.children.item(0) as HTMLElement | null)

const scroll = useScroll(child, { behavior: 'smooth' })

onMounted(() => {
  watch(
    () => scroll,
    (value) => {
      const { arrivedState } = value
      const target = child.value!
      const { scrollHeight, scrollWidth, clientHeight, clientWidth } = target

      if (scrollHeight === clientHeight) {
        tracker.value.delete('top')
        tracker.value.delete('bottom')
      }

      if (scrollWidth === clientWidth) {
        tracker.value.delete('left')
        tracker.value.delete('right')
      }

      const entries = Object.entries(arrivedState)
      const arrived = entries.filter(([, v]) => v).map(([k]) => k as Tracker)
      const unarrived = entries.filter(([, v]) => !v).map(([k]) => k as Tracker)

      arrived.forEach((v) => tracker.value.delete(v))
      unarrived.forEach((v) => tracker.value.add(v))
    },
    { immediate: true, deep: true },
  )
})
</script>

<template>
  <div
    v-if="$slots.default"
    ref="box"
    :class="['s-overflowbox', ...tracker]"
    :style="{ '--fade-color': fadeColor }"
  >
    <slot ref="el" />
  </div>
</template>

<style scoped>
.s-overflowbox {
  --start-color: var(--fade-color, var(--s-surface-elevated));

  @media (prefers-color-scheme: dark) {
    --start-color: var(--fade-color, var(--s-surface-ground));
  }

  position: relative;

  &.top {
    &::before {
      --gradient: linear-gradient(to bottom, var(--start-color), transparent);
      top: 0;
    }
  }

  &.bottom {
    &::after {
      --gradient: linear-gradient(to top, var(--start-color), transparent);
      bottom: 0;
    }
  }

  &.top::before,
  &.bottom::after {
    width: 100%;
    height: 39.0625%;
  }

  &.top::before,
  &.bottom::after {
    content: '';
    z-index: 1;
    display: block;
    position: absolute;
    background: var(--gradient);
    pointer-events: none;
  }
}
</style>
