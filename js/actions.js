import { fetchLocationsFromApi, fetchMenusFromApi } from './api'

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
    return fetchLocationsFromApi()
      .then((locations) => dispatch(setLocations(locations)))
  }
}
