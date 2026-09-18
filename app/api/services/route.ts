import { NextResponse } from 'next/server'
import { BRAND } from '@/lib/brand'

export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json(
    {
      company: BRAND.fullName,
      founder: 'Jackson M. Latimore Sr.',
      description:
        "Independent, education-first insurance agency serving families, workers, retirees and business owners across Pennsylvania's Coal Region.",
      services: [
        'Life Insurance',
        'Living Benefits',
        'Mortgage Protection',
        'Final Expense Insurance',
        'Whole Life Insurance',
        'Indexed Universal Life Insurance',
        'Fixed Indexed Annuities',
        'Retirement Income Strategies',
        'College Education Funding',
        'Critical Illness Coverage',
        'Key Person Insurance',
        'Business Continuity Planning',
        'Estate and Legacy Planning Education',
      ],
      serviceArea: [
        'Schuylkill County, Pennsylvania',
        'Luzerne County, Pennsylvania',
        'Northumberland County, Pennsylvania',
      ],
      phone: BRAND.phone,
      email: BRAND.email,
      website: BRAND.baseUrl,
      booking: `${BRAND.baseUrl}/book`,
      license: {
        state: 'Pennsylvania',
        doi: BRAND.paLicense,
        nipr: BRAND.nipr,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    },
  )
}
