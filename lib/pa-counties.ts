import { BRAND } from '@/lib/brand'

/** All 67 Pennsylvania counties, alphabetical. */
export const PA_COUNTIES = [
  'Adams', 'Allegheny', 'Armstrong', 'Beaver', 'Bedford', 'Berks', 'Blair', 'Bradford', 'Bucks', 'Butler',
  'Cambria', 'Cameron', 'Carbon', 'Centre', 'Chester', 'Clarion', 'Clearfield', 'Clinton', 'Columbia', 'Crawford',
  'Cumberland', 'Dauphin', 'Delaware', 'Elk', 'Erie', 'Fayette', 'Forest', 'Franklin', 'Fulton', 'Greene',
  'Huntingdon', 'Indiana', 'Jefferson', 'Juniata', 'Lackawanna', 'Lancaster', 'Lawrence', 'Lebanon', 'Lehigh', 'Luzerne',
  'Lycoming', 'McKean', 'Mercer', 'Mifflin', 'Monroe', 'Montgomery', 'Montour', 'Northampton', 'Northumberland', 'Perry',
  'Philadelphia', 'Pike', 'Potter', 'Schuylkill', 'Snyder', 'Somerset', 'Sullivan', 'Susquehanna', 'Tioga', 'Union',
  'Venango', 'Warren', 'Washington', 'Wayne', 'Westmoreland', 'Wyoming', 'York',
] as const

export const OUTSIDE_PA = 'Outside Pennsylvania'

const serviceCounties: readonly string[] = BRAND.counties

/** Service-area counties first, then the rest of Pennsylvania. */
export const OTHER_PA_COUNTIES = PA_COUNTIES.filter((county) => !serviceCounties.includes(county))
