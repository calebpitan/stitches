<script setup lang="ts">
import type { SVGAttributes } from 'vue'

import Loop from '@/assets/icons/loop.svg'

import SIcon from './SIcon.vue'

interface Props extends /* @vue-ignore */ SVGAttributes {}

defineOptions({ inheritAttrs: false })
defineProps<Props>()
</script>

<template>
  <SIcon>
    <Loop width="1em" height="1em" fill="currentColor" v-bind="$attrs" />
  </SIcon>
</template>
