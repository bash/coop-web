// @flow

import { h, Component } from 'preact'
import { formatDistance } from '../utils'

const maxLocations = () => window.innerWidth < 796 ? 3 : 8

const Distance = ({ distance }) => {
  return (
    <span class="distance">
      { `${formatDistance(distance)} away` }
    </span>
  )
}

const Location = ({ location, onSelect }) => {
  const onClick = () => {
    onSelect(location.id)
  }

  const onKeyPress = (event) => {
    if (event.key === 'Enter') {
      onSelect(location.id)
    }
  }

  return (
    <li class="location">
      <a onClick={onClick} onKeyPress={onKeyPress} tabIndex="0">
        { location.name }
        { location.distance && <Distance distance={location.distance}/> }
      </a>
    </li>
  )
}

export class Locations extends Component {
  constructor () {
    super()

    this.state.maxLocations = maxLocations()
  }

  _updateMaxLocations = () => {
    this.setState({ maxLocations: maxLocations() })
  }

  componentDidMount () {
    window.addEventListener('resize', this._updateMaxLocations)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._updateMaxLocations)
  }

  render ({ onSelectLocation, locations }, { maxLocations }) {
    const locationsCount = locations.length

    return (
      <div>
        <ul class="locations-list">
          { locations
            .slice(0, maxLocations)
            .map((location) => <Location location={location} onSelect={onSelectLocation}/>) }
        </ul>
        <footer class="locations-hidden">
          { locationsCount > maxLocations ? `${locationsCount - maxLocations} locations hidden` : '' }
        </footer>
      </div>
    )
  }
}
