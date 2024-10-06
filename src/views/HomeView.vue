<script setup lang="ts">
import { ref, watch } from 'vue'

import { TransitionPresets, useTransition } from '@vueuse/core'

import type Splitter from 'primevue/splitter'
import type SplitterPanel from 'primevue/splitterpanel'

import TaskControl, { type TaskGroupbarViewChangeEvent } from '@/components/TaskControl.vue'
import TaskManagement from '@/components/TaskManagement.vue'
import { useCustomBreakpoints } from '@/composables/useCustomBreakpoints'

const SHIFTED_SIZE = 25
const UNSHIFTED_SIZE = 45

const bp = useCustomBreakpoints()
const viewportIsLarge = bp.greaterOrEqual('lg')

const splitterRef = ref<InstanceType<typeof Splitter> | null>(null)

const size = ref(UNSHIFTED_SIZE)
const animatedSize = useTransition(size, {
  duration: 350,
  transition: TransitionPresets.easeInBack
})

const animate = (target: number) => (size.value = target)

function handleTaskGroupbarViewChange(ev: TaskGroupbarViewChangeEvent) {
  if (ev.type === 'shifted') {
    animate(SHIFTED_SIZE)
    return
  }

  animate(UNSHIFTED_SIZE)
}

watch([animatedSize, splitterRef], ([_size, _splitter]) => {
  // TODO: Reset state for the Splitter to update sizes.
  //       As the Splitter doesn't support this feature currently.
})
</script>

<template>
  <main class="s-main">
    <Splitter v-if="viewportIsLarge" ref="splitterRef" class="s-layout">
      <SplitterPanel ref="splitterPanel1Ref" :size="animatedSize" :min-size="animatedSize">
        <TaskControl @groupbar-view-change="handleTaskGroupbarViewChange" />
      </SplitterPanel>

      <SplitterPanel
        :size="100 - animatedSize"
        :min-size="animatedSize === UNSHIFTED_SIZE ? 50 : 60"
        style="overflow: auto"
      >
        <TaskManagement />
      </SplitterPanel>
    </Splitter>
  </main>
</template>

<style scoped>
.s-main {
  height: 100%;
}

.s-layout {
  display: flex;
  background-color: var(--s-surface-middle);
  height: 100%;
}
</style>
