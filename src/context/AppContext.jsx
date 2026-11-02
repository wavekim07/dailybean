/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useReducer } from 'react'
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
        grind: { ...initialState.settings.grind, ...saved.settings?.grind },
      },
    }
  } catch {
    return initialState
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, undefined, loadState)

  // 상태가 바뀔 때마다 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장 공간 부족 등은 무시 (화면 동작은 유지)
    }
  }, [state])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp은 AppProvider 안에서만 쓸 수 있어요.')
  return ctx
}
