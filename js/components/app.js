import { h, Component } from 'preact'
import { Locations } from './locations'
import { Location } from './location'
import { fetchLocationsByPosition } from '../api'


export class App extends Component {
  _onLocationChange = (location) => {
    this.setState({ location })
  }

  render ({}, { location }) {
    return (
      <div class="page-content">
        <div class="app-layout">
          <nav class="nav">
            <Locations onChange={this._onLocationChange}/>
          </nav>
          <main class="content">
            { location ? <Location location={location}/> : [] }
          </main>
        </div>
      </div>
    )
  }
}
