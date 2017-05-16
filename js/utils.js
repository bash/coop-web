// @flow

import type { Location } from './types'

export const formatDistance = (distance: number) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }

  return `${Math.round(distance / 10) / 100}km`
}

export const weekday = (timestamp: number) => {
  const format = new window.Intl.DateTimeFormat(navigator.languages, { weekday: 'long' })
  const date = new Date(timestamp * 1000)

  return format.format(date)
}

export const filterLocations = (locations: Array<Location>, search: string) => {
  const match = (location, search) => location.name.toLowerCase().indexOf(search)
  const normalizedSearch = search.trim().toLowerCase()

  if (search === '') {
    return locations
  }

  return locations
    .map((location) => ({ location, match: match(location, normalizedSearch) }))
    .filter(({ match }) => match > -1)
    .sort((a, b) => a.match - b.match)
    .map(({ location }) => location)
}

export function getCurrentPosition () {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject)
  })
}
