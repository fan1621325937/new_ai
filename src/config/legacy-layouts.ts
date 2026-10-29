import type { LayoutTemplate } from '@/types/dashboard'

const AREAS = [
  ['1/1/9/10', '1/10/5/13', '5/10/9/13', '9/1/13/4', '9/4/13/7', '9/7/13/10', '9/10/13/13'],
  ['1/4/9/10', '1/1/13/4', '1/10/5/13', '5/10/9/13', '9/4/13/7', '9/7/13/10', '9/10/13/13'],
  ['1/4/9/10', '1/1/5/4', '5/1/9/4', '1/10/13/13', '9/1/13/4', '9/4/13/7', '9/7/13/10'],
  ['1/4/13/10', '1/1/5/4', '5/1/9/4', '9/1/13/4', '1/10/5/13', '5/10/9/13', '9/10/13/13'],
  ['1/4/9/10', '1/1/5/4', '5/1/9/4', '1/10/5/13', '5/10/9/13', '9/1/13/4', '9/4/13/7', '9/7/13/10', '9/10/13/13'],
  ['1/1/9/10', '1/10/13/13', '9/1/13/4', '9/4/13/7', '9/7/13/10'],
  ['1/4/13/10', '1/1/7/4', '7/1/13/4', '1/10/7/13', '7/10/13/13'],
]

const LARGE_SLOTS: Record<number, number> = { 2: 2, 3: 4, 6: 2 }

export const LEGACY_LAYOUTS: LayoutTemplate[] = AREAS.map((areas, index) => ({
  id: index + 1,
  name: `默认布局${index + 1}`,
  slots: areas.map((area, slotIndex) => {
    const [row, col, endRow, endCol] = area.split('/').map(Number)
    const slotNo = slotIndex + 1
    return {
      id: `legacy-${index + 1}-${slotNo}`,
      key: `chart${slotNo}`,
      slotNo,
      col: (col - 1) * 2 + 1,
      row: (row - 1) * 2 + 1,
      colSpan: (endCol - col) * 2,
      rowSpan: (endRow - row) * 2,
      editable: slotNo !== 1,
      largeOnly: LARGE_SLOTS[index + 1] === slotNo,
    }
  }),
}))
