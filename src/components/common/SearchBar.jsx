export default function SearchBar({ value, onChange, placeholder = '검색' }) {
  return (
    <input
      className="input search"
      type="search"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
