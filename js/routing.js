// @flow

import { fetchMenus, selectLocation } from './actions'
import type { Store } from 'redux'
import type { LocationId } from './types'

const updateHash = ({ location }: { location: string }) => {
  if (location != null) window.location.hash = `#${location}`
}

const updateLocation = (store: Store, newLocation: ?LocationId) => {
  const { location } = store.getState()

  if (location === newLocation) return;
  if (newLocation == null) return;

  store.dispatch(selectLocation(newLocation))
  store.dispatch(fetchMenus(newLocation))
}

const getLocationFromHash = (): ?number => {
  return Number.parseInt(window.location.hash.substr(1)) || null
}

export const registerListeners = (store: Store) => {
  store.subscribe(() => updateHash(store.getState()))
  window.addEventListener('hashchange', () => updateLocation(store, getLocationFromHash()))
}

export const setLocationFromHash = (store: Store) => {
  updateLocation(store, getLocationFromHash())
}
