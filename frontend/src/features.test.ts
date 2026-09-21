import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { OCR_ENABLED } from './features'

const captureView = readFileSync('src/views/CaptureView.vue', 'utf8')
const settingsView = readFileSync('src/views/SettingsView.vue', 'utf8')
const dashboardView = readFileSync('src/views/DashboardView.vue', 'utf8')
const sourcesView = readFileSync('src/views/SourcesView.vue', 'utf8')

/**
 * The first release ships without screen capture (#192). These guard the two things
 * that are easy to get wrong when the switch is flipped back and forth, not the
 * switch itself.
 */
describe('the first release ships without screen capture', () => {
  it('the switch is off', () => {
    expect(OCR_ENABLED).toBe(false)
  })

  it.each([
    ['the capture block', /<div v-if="OCR_ENABLED" id="ocr-collect"/],
    ['the engine comparison', /<Transition v-if="OCR_ENABLED"/],
    ['the source picker', /<TextSourceGuide[^>]*OCR_ENABLED/],
    ['the engine picker', /<OcrSection v-if="OCR_ENABLED" \/>/],
    ['the capture hotkey', /<HotkeySection v-if="OCR_ENABLED" \/>/],
  ])('%s is behind the switch', (_name, pattern) => {
    expect(captureView + settingsView).toMatch(pattern)
  })

  it('manual paste is not nested inside an OCR-gated block', () => {
    // It used to sit inline in the one-time-setup row, so the switch took it down with
    // OCR. Pasting a line by hand is how you get unstuck when the hook finds nothing,
    // which is exactly the release where it has to work. Direct children of the session
    // branch are indented six spaces; anything inside the OCR row or column is deeper.
    expect(captureView).toMatch(/\n {6}<ManualPaste /)
  })

  it.each([
    ['the dashboard', dashboardView],
    ['the sources list', sourcesView],
  ])('%s does not report a capture region nobody can set', (_name, source) => {
    // 区域只有屏幕识别用得上，也只有它的框选工具设得了。把每一处提到区域的地方
    // 连同它前面最近的模板条件一起看：那个条件必须是这个开关。
    const mentions = [...source.matchAll(/对话区域/g)]
    expect(mentions.length).toBeGreaterThan(0)
    for (const { index } of mentions) {
      expect(source.slice(Math.max(0, index - 200), index)).toContain('OCR_ENABLED')
    }
  })

  it('a captured line still has somewhere to show up', () => {
    // Hook and clipboard lines land in CapturedLines too. It used to sit inside the
    // OCR column; hiding it along with OCR would leave the only source v1 supports
    // with no feedback at all.
    expect(captureView).toMatch(/<CapturedLines\s+v-else/)
  })
})
