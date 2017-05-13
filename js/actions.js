import { fetchLocationsByPositionFromApi, fetchLocationsFromApi, fetchMenusFromApi } from './api'
import { getCurrentPosition } from './utils'

export const SET_LOCATIONS = 'SET_LOCATIONS'
export const SELECT_LOCATION = 'SELECT_LOCATION'
export const RECEIVE_MENUS = 'RECEIVE_MENUS'
export const SELECT_DAY = 'SELECT_DAY'
export const SEARCH = 'SEARCH'

export const setLocations = (locations) => {
  return { type: SET_LOCATIONS, locations }
}

export const selectLocation = (location) => {
  return { type: SELECT_LOCATION, location }
}

export const receiveMenus = (menus) => {
  return { type: RECEIVE_MENUS, menus }
}

export const selectDay = (day) => {
  return { type: SELECT_DAY, day }
}

export const search = (search) => {
  return { type: SEARCH, search }
}

export const fetchMenus = (location) => {
  return (dispatch) => {
    return fetchMenusFromApi(location)
      .then((menus) => dispatch(receiveMenus(menus)))
  }
}

export const fetchLocations = () => {
  return (dispatch) => {
    let setByPosition = false

    const withoutLocation = fetchLocationsFromApi()
      .then((locations) => {
        if (!setByPosition) {
          dispatch(setLocations(locations))
        }
      })

    const withLocation = getCurrentPosition()
      .then(({ coords }) => fetchLocationsByPositionFromApi(coords.latitude, coords.longitude))
      .then((locations) => {
        setByPosition = true
        dispatch(setLocations(locations))
      })

    return Promise.all([withoutLocation, withLocation])
  }
}
