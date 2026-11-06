/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { rootReducer } from './reducers.js'
import { initialState } from './initialState.js'

const STORAGE_KEY = 'dailybean'
const AppContext = createContext(null)

// 시작할 때 localStorage에서 불러오고, 없거나 깨졌으면 기본값
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return initialState
    return {
      ...initialState,
      ...saved,
      settings: {
        ...initialState.settings,
        ...saved.settings,
        store: { ...initialState.settings.store, ...saved.settings?.store },
        businessHours: { ...initialState.settings.businessHours, ...saved.settings?.businessHours },
        checklists: { ...initialState.settings.checklists, ...saved.settings?.checklists },
        grind: { ...initialState.settings.grind, ...saved.settings?.grind },
      },
    }
  } catch {
    return initialState
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, undefined, loadState)
  const [saveError, setSaveError] = useState(false) // 저장이 실패했는지 (화면 위에 경고를 띄움)

  // 상태가 바뀔 때마다 저장
  useEffect(() => {
    let ok = true
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장 공간이 가득 찼거나 브라우저가 저장을 막음 → 조용히 넘어가면 데이터가 사라지니 사용자에게 알림
      ok = false
    }
    // 결과(성공/실패)는 저장이 끝난 뒤 화면에 반영 (effect 안에서 바로 setState 하면 렌더가 연달아 일어남)
    queueMicrotask(() => setSaveError(!ok))
  }, [state])

  return <AppContext.Provider value={{ state, dispatch, saveError }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp은 AppProvider 안에서만 쓸 수 있어요.')
  return ctx
}
