import { h, render } from 'preact'
import { ConnectedApp } from './components/app'

import { store } from './store'
import { setLocations } from './actions'
import { fetchLocations } from './api'

fetchLocations().then((locations) => store.dispatch(setLocations(locations)))

render(<ConnectedApp store={store}/>, document.body)
