import { applyMiddleware, createStore } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { reduce } from './reducers'

export const store = createStore(reduce, applyMiddleware(thunkMiddleware))
