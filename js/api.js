// @flow

import { compareNumbers } from './utils'
import type { MenuGroup, Menu } from './types'

const API_BASE = 'https://themachine.jeremystucki.com/coop/api/v2'
const encode = encodeURIComponent

function groupByDay(menus: Array<Menu>): Array<MenuGroup> {
  // TODO: we need a cleaner way to group by day
  const byDay: Map<number, Array<Menu>> = new Map()

  menus
    .sort((a, b) => compareNumbers(a.timestamp, b.timestamp))
    .forEach((menu: Menu) => {
      const { timestamp } = menu
      const menus = byDay.get(timestamp) || []

      byDay.set(timestamp, [...menus, menu])
    })

  return Array.from(byDay)
              .map(([timestamp, menus]) => ({ timestamp, menus }))
}

export function fetchMenusFromApi (location: number) {
  return window.fetch(`${API_BASE}/locations/${encode(location.toString())}/menus`)
    .then((resp) => resp.json())
    .then(({ results }) => groupByDay(results))
}

export function fetchLocationsFromApi () {
  return window.fetch(`${API_BASE}/locations`)
    .then((resp) => resp.json())
    .then(({ results }) => {
      return results.sort((a, b) => a.name.localeCompare(b.name))
    })
}

export function fetchLocationsByPositionFromApi (latitude: number, longitude: number) {
  return window.fetch(`${API_BASE}/locations?latitude=${encode(latitude.toString())}&longitude=${encode(longitude.toString())}`)
    .then((resp) => resp.json())
    .then(({ results }) => results)
}
