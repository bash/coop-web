/**
 *
 * @type {string}
 */
const API_BASE = 'https://themachine.jeremystucki.com/coop/api/v2'

const encode = encodeURIComponent

/**
 *
 * @param {string} location
 * @returns {Promise}
 */
export function fetchMenusFromApi (location) {
  return fetch(`${API_BASE}/locations/${encode(location)}/menus`)
    .then((resp) => resp.json())
    .then(({ results }) => {
      // TODO: we need a cleaner way to group by day
      const byDay = new Map()

      results
        .sort((a, b) => a.timestamp > b.timestamp)
        .forEach((menu) => {
          const timestamp = menu.timestamp

          if (byDay.has(timestamp)) {
            byDay.get(timestamp).push(menu)
          } else {
            byDay.set(timestamp, [menu])
          }
        })

      return Array.from(byDay).map(([day, menus]) => ({ day, menus }))
    })
}

/**
 *
 * @returns {Promise}
 */
export function fetchLocations () {
  return fetch(`${API_BASE}/locations`)
    .then((resp) => resp.json())
    .then(({ results }) => {
      return results.sort((a, b) => a.name.localeCompare(b.name))
    })
}

/**
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Array<{}>>}
 */
export function fetchLocationsByPosition (latitude, longitude) {
  return fetch(`${API_BASE}/locations?latitude=${encode(latitude)}&longitude=${encode(longitude)}`)
    .then((resp) => resp.json())
    .then(({ results }) => results)
}
