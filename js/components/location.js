// @flow

import { weekday } from '../utils'
import type { Location as LocationType, Menu, Day } from '../types'

export type LocationProps = {
  location: LocationType,
  menus: Array<Menu>,
  days: Array<Day>,
  onSelectDay: (number) => void,
}

const MenuItem = ({ menu }) => {
  return (
    <section class="menu-item">
      <h2>{menu.title}</h2>
      <h3>CHF {menu.price}</h3>
      <ul class="dishes">
        {menu.menu.map((dish) => <li>{dish}</li>)}
      </ul>
    </section>
  )
}

const DayItem = ({ day, timestamp, onClick, active }) => {
  return (
    <li class={`item${active ? ' -active' : ''}`} onClick={() => onClick(day)}>
      {weekday(timestamp)}
    </li>
  )
}

export const Location = ({ location, menus, days, onSelectDay }: LocationProps) => {
  return (
    <article>
      <h1>{location.name}</h1>
      <ul class="weekday-list">
        { days.map((day) => <DayItem onClick={onSelectDay} {...day} />) }
      </ul>
      <div class="menu-items">
        { menus.map((menu) => <MenuItem menu={ menu }/>)}
      </div>
    </article>
  )
}
