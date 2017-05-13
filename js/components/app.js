import { h } from 'preact'

// See: https://github.com/developit/preact-redux/pull/15
import preactRedux from 'preact-redux'
const { connect } = preactRedux

import { Locations } from './locations'
import { Location } from './location'
import { Search } from './search'
import { fetchMenus, search, selectLocation } from '../actions'
import { filterLocations } from '../utils'

const mapDispatchToProps = (dispatch) => {
  return {
    onSearch: (value) => dispatch(search(value)),
    onSelectLocation: (id) => {
      dispatch(selectLocation(id))
      dispatch(fetchMenus(id))
    }
  }
}

const mapStateToProps = ({ locations, location, menus, search }) => {
  return {
    locations: filterLocations(locations, search),
    location,
    menus
  }
}

// { location ? <Location location={location}/> : [] }

const App = ({ locations, menus, location, onSearch, onSelectLocation }) => {
  console.log(menus)

  return (
    <div class="page-content">
      <div class="app-layout">
        <nav class="nav">
          <Search onSearch={onSearch}/>
          <Locations locations={locations} onSelectLocation={onSelectLocation}/>
        </nav>
        <main class="content">
          { location }
        </main>
      </div>
    </div>
  )
}

export const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)
