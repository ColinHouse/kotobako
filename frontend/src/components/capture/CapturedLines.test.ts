import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Line } from '@/api/types'
import CapturedLines from './CapturedLines.vue'

function line(id: number, text: string): Line {
  return {
    id,
    session_id: 1,
    source_id: 1,
    text,
    raw_text: text,
    origin: 'ocr',
    screenshot_path: null,
    audio_path: null,
    position: null,
    locator: null,
    ord: null,
    speaker: null,
    translation_zh: null,
    status: 'inbox',
    captured_at: '2026-09-01T00:00:00Z',
    encounter_count: 0,
    unknown_count: null,
  }
}

function mountWith(lines: Line[]) {
  return mount(CapturedLines, {
    props: { lines, inboxLink: '/inbox' },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('CapturedLines', () => {
  it('does not advertise a shortcut that cannot fire', () => {
    // The shortcut runs an OCR collect, and the region picker that arms it is hidden
    // in this release (#192). Without OCR this panel is the whole capture screen, so
    // the hint would be its only piece of keyboard help -- pointing at nothing.
    expect(mountWith([]).text()).not.toContain('收藏这句')
  })

  it('shows the newest line first', () => {
    const wrapper = mountWith([line(2, '新しい台詞'), line(1, '古い台詞')])
    const rows = wrapper.findAll('li')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('新しい台詞')
    expect(rows[1]!.text()).toContain('古い台詞')
  })

  it('renders an in-place update without duplicating the row', async () => {
    const wrapper = mountWith([line(1, 'だんだ')])
    await wrapper.setProps({ lines: [line(1, 'だんだん')] })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('だんだん')
  })

  it('appends new lines as they arrive', async () => {
    const wrapper = mountWith([line(1, '一句目')])
    await wrapper.setProps({ lines: [line(2, '二句目'), line(1, '一句目')] })
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('二句目')
  })

  it('explains itself when nothing has arrived yet', () => {
    const wrapper = mountWith([])
    expect(wrapper.text()).toContain('收藏的句子会出现在这里')
  })
})
