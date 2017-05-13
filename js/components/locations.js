import { h, Component } from 'preact'
import { formatDistance } from '../utils'

const MAX_LOCATIONS = 8

const Distance = ({ distance }) => {
  return (
    <span class="distance">
      {`${formatDistance(distance)} away`}
    </span>
  )
}

const Location = ({ location, onSelect }) => {
  const onClick = (event) => {
    event.preventDefault()
    onSelect(location.id)
  }

  return (
    <li class="location">
      <a onClick={onClick}>
        {location.name}
        {location.distance ? <Distance distance={location.distance}/> : ''}
      </a>
    </li>
  )
}

export const Locations = ({ onSelectLocation, locations }) => {
  const locationsCount = locations.length

  return (
    <div>
      <ul class="locations-list">
        { locations
          .slice(0, MAX_LOCATIONS)
          .map((location) => <Location location={location} onSelect={onSelectLocation}/>)}
      </ul>
      <footer class="locations-hidden">
        { locationsCount > MAX_LOCATIONS ? `${locationsCount - MAX_LOCATIONS} locations hidden` : ''}
      </footer>
    </div>
  )
}
