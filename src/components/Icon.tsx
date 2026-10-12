import grid from '../assets/icons/grid.svg'
import settings from '../assets/icons/settings.svg'
import users from '../assets/icons/users.svg'
import chat from '../assets/icons/chat.svg'
import wash from '../assets/icons/wash.svg'
import bag from '../assets/icons/bag.svg'
import brand from '../assets/icons/brand.svg'
import bell from '../assets/icons/bell.svg'
import check from '../assets/icons/check.svg'

const icons = { grid, settings, users, chat, wash, bag, brand, bell, check }
export type IconName = keyof typeof icons
export function Icon({ name }: { name: IconName }) {
  return <span className={`workspace-icon ${name === 'brand' ? 'workspace-brand-icon' : ''}`} aria-hidden="true"><img src={icons[name]} alt="" /></span>
}
