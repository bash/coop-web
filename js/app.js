// @flow

import { render } from 'preact'
import { ConnectedApp } from './components/app'

import { store } from './store'
import { fetchLocations } from './actions'
import { registerListeners, setLocationFromHash } from './routing'

store.dispatch(fetchLocations())

setLocationFromHash(store)
registerListeners(store)

render(<ConnectedApp store={store}/>, document.body)
