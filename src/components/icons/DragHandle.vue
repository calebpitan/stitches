<script setup lang="ts">
import type { SVGAttributes } from 'vue'

import DragHandle from '@/assets/icons/draggable.svg'

import SIcon from './SIcon.vue'

interface Props extends /* @vue-ignore */ SVGAttributes {}

defineOptions({ inheritAttrs: false })
defineProps<Props>()
</script>

<template>
  <SIcon>
    <DragHandle fill="currentColor" v-bind="$attrs" />
  </SIcon>
</template>
