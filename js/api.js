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
export function fetchLocationFromApi (location) {
  return fetch(`${API_BASE}/locations/${encode(location)}`)
    .then((resp) => resp.json())
}


/**
 *
 * @param {string} location
 * @returns {Promise}
 */
export function fetchMenusFromApi (location) {
  return fetch(`${API_BASE}/locations/${encode(location)}/menus`)
    .then((resp) => resp.json())
    .then((resp) => resp.results)
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
