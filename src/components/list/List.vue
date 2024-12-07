<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts" generic="Item extends IListItem">
import { isFn } from '@stitches/common'

export type IListItem = string | string[] | Record<string, unknown>[] | Record<string, unknown>
export interface ListProps<Item extends IListItem> {
  items: Array<Item>
  itemKey?: string | ((item: Item) => string)
}

withDefaults(defineProps<ListProps<Item>>(), {})
</script>

<template>
  <ul class="s-list">
    <slot
      v-for="(item, index) in items"
      name="listitem"
      :index="index"
      :element="item"
      :key="isFn(itemKey) ? itemKey(item) : itemKey"
    >
    </slot>
  </ul>
</template>

<style scoped>
.s-list {
  padding: 0;
  position: relative;
  list-style-type: none;
}
</style>
