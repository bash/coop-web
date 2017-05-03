import { h, Component } from 'preact'
import { fetchLocation, fetchLocationMenus } from '../api'

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

export class Location extends Component {
  constructor () {
    super()

    this.state.location = {}
    this.state.menus = []
  }

  componentWillMount () {
    this._fetchData(this.props)
  }

  componentWillReceiveProps (nextProps) {
    this._fetchData(nextProps)
  }

  render ({ location: _location }, { location, menus }) {
    return (
      <article>
        <h1>{location.name}</h1>
        <div class="menu-items">
          { menus.map((menu) => <Menu menu={ menu }/>)}
        </div>
      </article>
    )
  }

  _fetchData ({ location }) {
    let requests = Promise.all([
      fetchLocation(location),
      fetchLocationMenus(location)
    ])

    return requests
      .then(([location, menus]) => this.setState({ location: location, menus: menus.results }))
  }
}
