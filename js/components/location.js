import { h } from 'preact'
import { weekday } from '../utils'

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

export const Location = ({ location, menus, days, onSelectDay }) => {
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
