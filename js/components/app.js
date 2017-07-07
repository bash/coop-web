import { connect } from 'preact-redux'

import { Locations } from './locations'
import { Location } from './location'
import { Search } from './search'
import { fetchMenus, search, selectLocation, selectDay } from '../actions'
import { compareNumbers, filterLocations } from '../utils'

const mapDispatchToProps = (dispatch) => {
  return {
    onSearch: (value) => dispatch(search(value)),
    onSelectLocation: (id) => {
      dispatch(selectLocation(id))
      dispatch(fetchMenus(id))
    },
    onSelectDay: (day) => {
      dispatch(selectDay(day))
    }
  }
}

const findLocation = (locations, location) => {
  return locations.find(($) => $.id === location)
}

const filterMenus = (menus, day) => {
  const dayMenus = menus[day]

  if (dayMenus == null) {
    return []
  }

  return dayMenus.menus
}

const days = (menus, day) => {
  if (menus == null) {
    return []
  }

  return menus
    .map(({ timestamp }, i) => ({ day: i, timestamp, active: (i === day) }))
    .sort((a, b) => compareNumbers(a, b))
}

const mapStateToProps = ({ locations, location, menus, day, search }) => {
  return {
    locations: filterLocations(locations, search),
    location: findLocation(locations, location),
    menus: filterMenus(menus, day),
    days: days(menus, day)
  }
}

const App = ({ locations, menus, location, days, onSearch, onSelectLocation, onSelectDay }) => {
  return (
    <div class="page-content">
      <div class="app-layout">
        <nav class="nav">
          <Search onSearch={onSearch}/>
          <Locations locations={locations} activeLocation={location && location.id} onSelectLocation={onSelectLocation}/>
        </nav>
        <main class="content">
          { location && <Location location={location} menus={menus} days={days} onSelectDay={onSelectDay}/> }
        </main>
        <footer class="footer">
          Created by <a class="default-link" href="https://github.com/bash">bash</a>.
          Data source: <a class="default-link" href="https://github.com/STJEREM/coop">STJEREM/coop</a>.
        </footer>
      </div>
    </div>
  )
}

export const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)
