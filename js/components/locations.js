import { h, Component } from 'preact'
import { fetchLocations, fetchLocationsByPosition } from '../api'

const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }

  return `${Math.round(distance / 10) / 100}km`
}

export class Locations extends Component {
  constructor () {
    super()

    this.state.locations = []
    this.state.filteredLocations = []
    this.state.search = null
    this.state.loadedByPosition = false
  }

  _onChange = (location) => {
    return (event) => {
      event.preventDefault()

      this.props.onChange(location)
    }
  }

  _onInput = (event) => {
    const search = event.target.value.toLowerCase()

    this.setState({ search: search })
  }

  _getFilteredLocations () {
    if (!this.state.search) {
      return this.state.locations
    }

    const search = this.state.search.toLowerCase()

    return this.state.locations
      .map((location) => ({ location, match: location.name.toLowerCase().indexOf(search) }))
      .filter(({ match }) => match > -1)
      .sort((a, b) => a.match > b.match)
      .map(({ location }) => location)
  }

  componentDidMount () {
    fetchLocations()
      .then((locations) => {
        if (!this.state.loadedByPosition) {
          this.setState({ locations })
        }
      })

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      fetchLocationsByPosition(coords.latitude, coords.longitude)
        .then((locations) => {
          this.setState({ locations, loadedByPosition: true })
          this.props.onChange(locations[0])
        })
    })
  }

  render ({ onSelectLocation }, {}) {
    const locations = this._getFilteredLocations()

    return (
      <div>
        <input type="search" placeholder="Search" onInput={this._onInput} class="locations-search"/>
        <ul class="locations-list">
          { locations.map((location) => (
            <li class="location">
              <a href="#" onClick={this._onChange(location)}>
                {location.name}
                <span class="distance">
                  {location.distance ? `${formatDistance(location.distance)} away` : ''}
                </span>
              </a>
            </li>
          )) }
        </ul>
      </div>
    )
  }
}
