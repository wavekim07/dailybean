// 기본 배경 사진: 파도김 근무 카페 사진 (public/photos). 사용자가 바꾸거나 직접 올릴 수 있음
export const PRESET_PHOTOS = [
  { id: 'table', src: '/photos/cafe-table.jpg', label: '테이블' },
  { id: 'lounge', src: '/photos/cafe-lounge.jpg', label: '라운지' },
  { id: 'bar', src: '/photos/cafe-bar.jpg', label: '바' },
  { id: 'flowers', src: '/photos/cafe-flowers.jpg', label: '드라이플라워' },
]

export function photoSrc(settings) {
  if (settings.photo === 'custom' && settings.customPhoto) return settings.customPhoto
  return (PRESET_PHOTOS.find((p) => p.id === settings.photo) ?? PRESET_PHOTOS[0]).src
}

// 올린 사진을 긴 변 1600px, JPEG 80%로 줄여서 data URL로 (브라우저 저장 공간이 작아서)
export function resizeImage(file, max = 1600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('사진 파일만 올릴 수 있어요.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('사진을 읽지 못했어요.')) }
    img.src = url
  })
}
