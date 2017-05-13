import { SELECT_LOCATION, SET_LOCATIONS, SEARCH, RECEIVE_MENUS } from './actions'

const initialState = {
  locations: [],
  location: null,
  menus: [],
  search: '',
  weekday: 0,
}

export function reduce (state = initialState, action) {
  switch (action.type) {
    case SELECT_LOCATION:
      return { ...state, location: action.location }
    case RECEIVE_MENUS:
      return { ...state, menus: action.menus }
    case SET_LOCATIONS:
      return { ...state, locations: action.locations }
    case SEARCH:
      return { ...state, search: action.search }
  }

  return state
}
