// @flow

import { Component } from 'preact'
import { formatDistance } from '../utils'

import type { LocationId, Location } from '../types'

export type LocationsProps = {
  onSelectLocation: (id: LocationId) => void,
  locations: Array<Location>,
  activeLocation: LocationId,
}

type LocationItemProps = {
  onSelect?: (id: LocationId) => void,
  location: Location,
  isActive?: boolean,
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

const LocationItem = ({ location, onSelect = () => {}, isActive = false }: LocationItemProps) => {
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

  render ({ onSelectLocation, locations, activeLocation: activeLocationId }: LocationsProps, { maxLocations }: LocationsState) {
    const locationsCount = locations.length

    const visibleLocations = locations
      .filter(({ id }) => id !== activeLocationId)
      .slice(0, maxLocations)

    const activeLocation = activeLocationId && locations.find(({ id }) => id === activeLocationId)

    return (
      <div>
        <ul class="locations-list">
          { activeLocation && <LocationItem location={activeLocation} isActive={true}/>}
          { visibleLocations.map((location) => (<LocationItem location={location} onSelect={onSelectLocation}/>)) }
        </ul>
        <footer class="locations-hidden">
          { locationsCount > maxLocations ? `${locationsCount - maxLocations} locations hidden` : '' }
        </footer>
      </div>
    )
  }
}
