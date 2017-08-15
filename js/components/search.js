// @flow

export type SearchProps = {
  onSearch: (search: string) => void,
}

export function Search ({ onSearch }: SearchProps) {
  return (
    <input type="search"
           placeholder="Search"
           onInput={(event) => onSearch(event.target.value)}
           class="locations-search" />
  )
}
