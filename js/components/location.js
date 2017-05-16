// @flow

import { h } from 'preact'
import { weekday } from '../utils'
import type { Location as LocationType, Menu as MenuType } from '../types'

const Menu = ({ menu }) => {
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

const Day = ({ day, timestamp, onClick, active }) => {
  return (
    <li class={`item${active ? ' -active' : ''}`} onClick={() => onClick(day)}>
      {weekday(timestamp)}
    </li>
  )
}

type LocationProps = {
  location: LocationType,
  menus: Array<MenuType>,
  days: Array<{ day: number, timestamp: number, active: boolean }>,
  onSelectDay: (day: number) => void
}

export const Location = ({ location, menus, days, onSelectDay }: LocationProps) => {
  return (
    <article>
      <h1>{location.name}</h1>
      <ul class="weekday-list">
        { days.map((day) => <Day onClick={onSelectDay} {...day} />) }
      </ul>
      <div class="menu-items">
        { menus.map((menu) => <Menu menu={ menu }/>)}
      </div>
    </article>
  )
}
