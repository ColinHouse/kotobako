import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { OCR_ENABLED } from './features'

const captureView = readFileSync('src/views/CaptureView.vue', 'utf8')
const settingsView = readFileSync('src/views/SettingsView.vue', 'utf8')

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

  it('a captured line still has somewhere to show up', () => {
    // Hook and clipboard lines land in CapturedLines too. It used to sit inside the
    // OCR column; hiding it along with OCR would leave the only source v1 supports
    // with no feedback at all.
    expect(captureView).toMatch(/<CapturedLines\s+v-else/)
  })
})
