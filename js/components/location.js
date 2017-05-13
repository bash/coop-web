import { h, Component } from 'preact'
// import { fetchLocationMenus } from '../api'

const weekday = (timestamp) => {
  const format = new Intl.DateTimeFormat(navigator.languages, { weekday: 'long' })
  const date = new Date(timestamp * 1000)

  return format.format(date)
}

const groupByDay = (menus) => {
  const byDay = new Map()

  menus
    .sort((a, b) => a.timestamp > b.timestamp)
    .forEach((menu) => {
      const timestamp = menu.timestamp

      if (byDay.has(timestamp)) {
        byDay.get(timestamp).push(menu)
      } else {
        byDay.set(timestamp, [menu])
      }
    })

  return byDay
}

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

const Day = ({ day, onSelect, active }) => {
  return (
    <li class={`item${active ? ' -active' : ''}`} onClick={onSelect(day)}>
      {weekday(day)}
    </li>
  )
}

export class Location extends Component {
  constructor () {
    super()

    this.state.menusByDay = new Map()
    this.state.day = null
  }

  _onDaySelect = (day) => {
    return () => {
      this.setState({ day })
    }
  }

  componentWillMount () {
    this._fetchData(this.props)
  }

  componentWillReceiveProps (nextProps) {
    this._fetchData(nextProps)
  }

  render ({ location }, { menusByDay, day }) {
    const menus = menusByDay.get(day) || []
    const days = Array.from(menusByDay.keys())

    return (
      <article>
        <h1>{location.name}</h1>
        <ul class="weekday-list">
          { days.map(($) => <Day day={$} active={$ === day} onSelect={this._onDaySelect}/>) }
        </ul>
        <div class="menu-items">
          { menus.map((menu) => <Menu menu={ menu }/>)}
        </div>
      </article>
    )
  }

  _fetchData ({ location }) {
    /*fetchLocationMenus(location.id)
      .then((menus) => {
        const menusByDay = groupByDay(menus)
        const day = menusByDay.keys().next().value

        this.setState({ menusByDay, day })
      })*/
  }
}
