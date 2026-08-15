import { useState } from 'react'
import { SelectDropdown } from '@/components/ui'
import css from './EnterBehaviorRow.module.css'

export function EnterBehaviorRow() {
  const [behavior, setBehavior] = useState<'enter' | 'shift_enter'>('enter')

  const OPTIONS = [
    {
      value: 'enter',
      label: 'Enter để gửi tin nhắn',
      description: 'Nhấn Enter để gửi, Shift + Enter để xuống dòng',
    },
    {
      value: 'shift_enter',
      label: 'Ctrl/Cmd + Enter để gửi',
      description: 'Nhấn Ctrl+Enter để gửi, Enter để xuống dòng mới',
    },
  ]

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>Hành vi phím Enter trong ô soạn thảo</div>
        <div className={css.desc}>
          Chọn cách thức phím Enter gửi tin nhắn hoặc xuống dòng mới khi đang nhập văn bản.
        </div>
      </div>

      <div style={{ minWidth: 240 }}>
        <SelectDropdown
          variant="form"
          placement="bottom-end"
          value={behavior}
          options={OPTIONS}
          onChange={(val) => setBehavior(val as 'enter' | 'shift_enter')}
        />
      </div>
    </div>
  )
}
