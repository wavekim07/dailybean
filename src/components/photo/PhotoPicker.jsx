import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { PRESET_PHOTOS, resizeImage } from '../../utils/photos.js'

// 배경 사진 고르기: 기본 사진 중 선택하거나 내 사진 올리기
export default function PhotoPicker({ onDone }) {
  const { state, dispatch } = useApp()
  const { photo, customPhoto } = state.settings
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  const choose = (id) => { dispatch({ type: 'UPDATE_SETTINGS', payload: { photo: id } }); onDone?.() }

  const upload = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setMsg('사진을 줄이는 중…')
    try {
      const dataUrl = await resizeImage(file)
      dispatch({ type: 'UPDATE_SETTINGS', payload: { photo: 'custom', customPhoto: dataUrl } })
      setMsg('')
      onDone?.()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const options = [...PRESET_PHOTOS, ...(customPhoto ? [{ id: 'custom', src: customPhoto, label: '내 사진' }] : [])]
  return (
    <div className="photo-picker">
      <div className="photo-grid">
        {options.map((p) => (
          <button key={p.id} type="button" className={`photo-option ${photo === p.id ? 'selected' : ''}`} onClick={() => choose(p.id)} aria-label={`${p.label} 사진 선택`}>
            <img src={p.src} alt="" />
            <span>{p.label}</span>
          </button>
        ))}
        <button type="button" className="photo-option upload" onClick={() => fileRef.current.click()}>
          <span className="plus">＋</span>
          <span>내 사진 올리기</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      {msg && <p className="muted">{msg}</p>}
    </div>
  )
}
