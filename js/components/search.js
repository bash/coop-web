export function Search ({ onSearch }) {
  return (
    <input type="search"
           placeholder="Search"
           onInput={(event) => onSearch(event.target.value)}
           class="locations-search" />
  )
}
