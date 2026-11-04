import { useApp } from '../../context/AppContext.jsx'
import { photoSrc } from '../../utils/photos.js'
import StaffPicker from './StaffPicker.jsx'

// photo를 주면 매장 사진 띠 위에 제목 표시 (설정에서 고른 배경 사진)
export default function PageHeader({ title, description, photo = false }) {
  const { state } = useApp()
  return (
    <header className={`page-header ${photo ? 'with-photo' : ''}`} style={photo ? { backgroundImage: `url(${photoSrc(state.settings)})` } : undefined}>
      <div className="page-header-top">
        <h1>{title}</h1>
        <StaffPicker dark={photo} />
      </div>
      {description && <p>{description}</p>}
    </header>
  )
}
