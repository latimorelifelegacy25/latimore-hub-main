import { BRAND } from '@/lib/brand'
import { OTHER_PA_COUNTIES, OUTSIDE_PA } from '@/lib/pa-counties'

/**
 * <option> list for a county <select>: the service-area counties, every other
 * Pennsylvania county, and an out-of-state choice. Render inside a <select>
 * after its own placeholder option.
 */
export default function CountyOptions({ optionStyle }: { optionStyle?: React.CSSProperties }) {
  return (
    <>
      <optgroup label="Our service area" style={optionStyle}>
        {BRAND.counties.map((county) => (
          <option key={county} value={county} style={optionStyle}>{county}</option>
        ))}
      </optgroup>
      <optgroup label="Other Pennsylvania counties" style={optionStyle}>
        {OTHER_PA_COUNTIES.map((county) => (
          <option key={county} value={county} style={optionStyle}>{county}</option>
        ))}
      </optgroup>
      <option value={OUTSIDE_PA} style={optionStyle}>{OUTSIDE_PA}</option>
    </>
  )
}
