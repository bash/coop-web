// @flow

import { h, render } from 'preact'
import { ConnectedApp } from './components/app'

import { store } from './store'
import { fetchLocations } from './actions'

store.dispatch(fetchLocations())

render(<ConnectedApp store={store}/>, document.body)
