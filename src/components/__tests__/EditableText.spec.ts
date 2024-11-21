import { mount } from '@vue/test-utils'

import { describe, expect, it } from 'vitest'

import { sleep } from '@/utils'

import EditableText from '../editable/EditableText.vue'

describe('EditableText', () => {
  it('renders properly', () => {
    const wrapper = mount(EditableText, { props: { text: 'Hello World!' } })

    expect(wrapper.text()).toContain('Hello World!')
    expect(wrapper.attributes()).toMatchInlineSnapshot(`
      {
        "class": "s-editable-text",
        "contenteditable": "false",
        "data-placeholder": "Enter text...",
        "data-v-5e4b270b": "",
        "style": "display: -webkit-box; overflow: hidden; user-select: none;",
        "tabindex": "0",
      }
    `)
  })

  it('becomes editable on focus (after 150ms)', async () => {
    const wrapper = mount(EditableText, { props: { text: 'Hello World!' } })
    await wrapper.trigger('focus').then(() => sleep(150))
    expect(wrapper.attributes().contenteditable).toEqual('true')
  })
})
