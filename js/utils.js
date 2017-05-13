export const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }

  return `${Math.round(distance / 10) / 100}km`
}

export const weekday = (timestamp) => {
  const format = new Intl.DateTimeFormat(navigator.languages, { weekday: 'long' })
  const date = new Date(timestamp * 1000)

  return format.format(date)
}

export const filterLocations = (locations, search) => {
  const match = (location, search) => location.name.toLowerCase().indexOf(search)

  if (search === '') {
    return locations
  }

  return locations
    .map((location) => ({ location, match: match(location, search) }))
    .filter(({ match }) => match > -1)
    .sort((a, b) => a.match > b.match)
    .map(({ location }) => location)
}
