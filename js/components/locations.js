// @flow

import { Component } from 'preact'
import { formatDistance } from '../utils'

import type { LocationId, Location } from '../types'

export type LocationsProps = {
  onSelectLocation: (id: LocationId) => void,
  locations: Array<Location>,
  activeLocation: LocationId,
}

type LocationsState = {
  maxLocations: number,
}

const maxLocations = () => window.innerWidth < 796 ? 3 : 8

const Distance = ({ distance }: { distance: number }) => {
  return (
    <span class="distance">
      { `${formatDistance(distance)} away` }
    </span>
  )
}

const LocationItem = ({ location, onSelect, isActive }) => {
  const onClick = () => onSelect(location.id)

  const onKeyPress = (event) => {
    if (event.key === 'Enter') onSelect(location.id)
  }

  return (
    <li class={isActive ? 'location -active' : 'location'}>
      <a onClick={onClick} onKeyPress={onKeyPress} tabIndex="0">
        { location.name }
        { location.distance && <Distance distance={location.distance}/> }
      </a>
    </li>
  )
}

export class Locations extends Component<LocationsProps, LocationsState> {
  constructor () {
    super()

    this.state.maxLocations = maxLocations()
  }

  _updateMaxLocations = () => {
    window.requestAnimationFrame(() => {
      this.setState({ maxLocations: maxLocations() })
    })
  }

  componentDidMount () {
    window.addEventListener('resize', this._updateMaxLocations)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._updateMaxLocations)
  }

  render ({ onSelectLocation, locations, activeLocation }: LocationsProps, { maxLocations }: LocationsState) {
    const locationsCount = locations.length

    return (
      <div>
        <ul class="locations-list">
          { locations
            .slice(0, maxLocations)
            .map((location) => <LocationItem location={location} isActive={location.id === activeLocation} onSelect={onSelectLocation}/>) }
        </ul>
        <footer class="locations-hidden">
          { locationsCount > maxLocations ? `${locationsCount - maxLocations} locations hidden` : '' }
        </footer>
      </div>
    )
  }
}
