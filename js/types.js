// @flow

export type Location = { id: number, name: string }
export type Menu = { menu: Array<string>, price: number, timestamp: number, title: string }
export type GroupedMenus = Array<{ timestamp: number, menus: Array<Menu> }>
