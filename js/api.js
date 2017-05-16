// @flow

import type { GroupedMenus, Location } from './types'

const API_BASE = 'https://themachine.jeremystucki.com/coop/api/v2'
const encode = encodeURIComponent

export function fetchMenusFromApi (location: number): Promise<GroupedMenus> {
  return fetch(`${API_BASE}/locations/${encode(location.toString())}/menus`)
    .then((resp) => resp.json())
    .then(({ results }) => {
      // TODO: we need a cleaner way to group by day
      const byDay = new Map()

      results
        .sort((a, b) => a.timestamp > b.timestamp)
        .forEach((menu) => {
          const timestamp = menu.timestamp
          const menus = byDay.get(timestamp)

          if (menus != null) {
            menus.push(menu)
          } else {
            byDay.set(timestamp, [menu])
          }
        })

      return Array.from(byDay).map(([timestamp, menus]) => ({ timestamp, menus }))
    })
}

export function fetchLocationsFromApi (): Promise<Array<Location>> {
  return fetch(`${API_BASE}/locations`)
    .then((resp) => resp.json())
    .then(({ results }) => {
      return results.sort((a, b) => a.name.localeCompare(b.name))
    })
}

export function fetchLocationsByPositionFromApi (latitude: number, longitude: number) {
  return fetch(`${API_BASE}/locations?latitude=${encode(latitude.toString())}&longitude=${encode(longitude.toString())}`)
    .then((resp) => resp.json())
    .then(({ results }) => results)
}
