// @flow

export type LocationId = number

// todo: add more props
export type Location = {
  id: LocationId,
  name: string,
  distance?: number,
}

export type Menu = {
  timestamp: number,
  title: string,
  price: number,
  menu: Array<string>,
}

export type MenuGroup = {
  timestamp: number,
  menus: Array<Menu>,
}

export type Day = {
  day: number,
  timestamp: number,
  active: boolean,
}
