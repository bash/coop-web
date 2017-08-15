// @flow

import { SELECT_LOCATION, SET_LOCATIONS, SEARCH, RECEIVE_MENUS, SELECT_DAY } from './actions'
import type { Location, LocationId, Menu } from './types'

const initialState = {
  locations: [],
  location: null,
  menus: [],
  search: '',
  day: 0,
}

type State = {
  locations: Array<Location>,
  location: ?LocationId,
  menus: Array<Menu>,
  search: string,
  day: number,
}

export function reduce (state: State = initialState, { type, ...action }: { type: string }) {
  switch (type) {
    case SELECT_LOCATION:
      return { ...state, location: action.location }
    case RECEIVE_MENUS:
      return { ...state, menus: action.menus }
    case SET_LOCATIONS:
      return { ...state, locations: action.locations }
    case SEARCH:
      return { ...state, search: action.search }
    case SELECT_DAY:
      return { ...state, day: action.day }
  }

  return state
}
