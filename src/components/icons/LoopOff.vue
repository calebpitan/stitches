<script setup lang="ts">
import type { SVGAttributes } from 'vue'

import LoopOff from '@/assets/icons/loop-off.svg'

import SIcon from './SIcon.vue'

interface Props extends /* @vue-ignore */ SVGAttributes {}

defineOptions({ inheritAttrs: false })
defineProps<Props>()
</script>

<template>
  <SIcon>
    <LoopOff width="1em" height="1em" fill="currentColor" v-bind="$attrs" />
  </SIcon>
</template>
