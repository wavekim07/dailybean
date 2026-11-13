// @vitest-environment jsdom
// 샷 기록 입력 검사: 분쇄도 0은 받아야 함 (Mahlkönig E80S처럼 0~10 눈금이고 0이 가장 가는 그라인더)
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ShotForm from '../src/pages/Grind/ShotForm.jsx'

afterEach(cleanup)

function fill(onSubmit, grind) {
  render(<ShotForm beans={[{ id: 'b1', name: '블렌드' }]} defaultBeanId="b1" suggestedGrind="" onSubmit={onSubmit} saving={false} />)
  fireEvent.change(screen.getByLabelText('분쇄도'), { target: { name: 'grind', value: grind } })
  fireEvent.change(screen.getByLabelText('추출 시간 (초)'), { target: { name: 'time', value: '28' } })
  fireEvent.click(screen.getByText('기록 저장'))
}

describe('샷 기록 입력 검사', () => {
  it('분쇄도 0은 저장된다', () => {
    const onSubmit = vi.fn(async () => true)
    fill(onSubmit, '0')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0].grind).toBe(0)
  })
  it('분쇄도를 비우거나 음수면 막는다', () => {
    const onSubmit = vi.fn(async () => true)
    fill(onSubmit, '')
    expect(onSubmit).not.toHaveBeenCalled()
    cleanup()
    fill(onSubmit, '-1')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
