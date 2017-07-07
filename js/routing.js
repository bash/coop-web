import { fetchMenus, selectLocation } from './actions'

const updateHash = ({ location }) => {
  if (location != null) window.location.hash = `#${location}`
}

const updateLocation = (store, newLocation) => {
  const { location } = store.getState()

  if (location === newLocation) return;

  store.dispatch(selectLocation(newLocation))
  store.dispatch(fetchMenus(newLocation))
}

const getLocationFromHash = () => {
  return Number.parseInt(window.location.hash.substr(1)) || null
}

export const registerListeners = (store) => {
  store.subscribe(() => updateHash(store.getState()))
  window.addEventListener('hashchange', () => updateLocation(store, getLocationFromHash()))
}

export const setLocationFromHash = (store) => {
  updateLocation(store, getLocationFromHash())
}
