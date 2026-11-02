export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="actions">
          <button className="btn" onClick={onCancel}>취소</button>
          <button className="btn danger" onClick={onConfirm}>삭제</button>
        </div>
      </div>
    </div>
  )
}
