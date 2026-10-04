export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { createOpenAIJsonCompletion } from '@/lib/ai/client'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    // Get recent data for analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const prevWeekStart = new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalInquiries,
      totalContacts,
      totalBookings,
      lastWeekInquiries,
      prevWeekInquiries,
      sourceGroups,
      productGroups,
      trendData,
    ] = await Promise.all([
      prisma.inquiry.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.contact.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.appointment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.inquiry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.inquiry.count({ where: { createdAt: { gte: prevWeekStart, lt: sevenDaysAgo } } }),
      prisma.inquiry.groupBy({
        by: ['source'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
      }),
      prisma.inquiry.groupBy({
        by: ['productInterest'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
      }),
      // Get daily counts for the last 30 days
      prisma.$queryRaw<Array<{ date: string; inquiries: number; contacts: number; bookings: number }>>`
        SELECT
          DATE("createdAt")::text as date,
          COUNT(CASE WHEN type = 'inquiry' THEN 1 END)::int as inquiries,
          COUNT(CASE WHEN type = 'contact' THEN 1 END)::int as contacts,
          COUNT(CASE WHEN type = 'booking' THEN 1 END)::int as bookings
        FROM (
          SELECT "createdAt", 'inquiry' as type FROM "Inquiry" WHERE "createdAt" >= ${thirtyDaysAgo}
          UNION ALL
          SELECT "createdAt", 'contact' as type FROM "Contact" WHERE "createdAt" >= ${thirtyDaysAgo}
          UNION ALL
          SELECT "createdAt", 'booking' as type FROM "Appointment" WHERE "createdAt" >= ${thirtyDaysAgo}
        ) combined
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `,
    ])

    // Calculate basic metrics
    const conversionRate = totalInquiries > 0 ? (totalBookings / totalInquiries * 100) : 0

    const topSources: Record<string, number> = {}
    for (const row of sourceGroups) {
      const source = row.source || 'unknown'
      topSources[source] = (topSources[source] || 0) + row._count._all
    }
    const topProducts: Record<string, number> = {}
    for (const row of productGroups) {
      const product = row.productInterest || 'unknown'
      topProducts[product] = (topProducts[product] || 0) + row._count._all
    }

    const inquiryGrowth = prevWeekInquiries > 0 ? ((lastWeekInquiries - prevWeekInquiries) / prevWeekInquiries * 100) : 0

    // Prepare data for AI analysis
    const analysisData = {
      totalInquiries,
      totalContacts,
      totalBookings,
      conversionRate: conversionRate.toFixed(1),
      inquiryGrowth: inquiryGrowth.toFixed(1),
      recentTrends: trendData.slice(0, 7), // Last 7 days
      topSources,
      topProducts,
    }

    // Generate AI insights
    const insights = await createOpenAIJsonCompletion({
      system: 'You are an expert business analyst specializing in lead generation and conversion optimization. Analyze the provided data and provide actionable insights.',
      user: `Analyze this lead generation and conversion data and provide predictive insights. Focus on trends, opportunities, and recommendations.

Data: ${JSON.stringify(analysisData, null, 2)}`,
      schemaName: 'predictiveInsights',
      schema: {
        type: 'object',
        properties: {
          trendAnalysis: { type: 'string' },
          predictions: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } }
        },
        required: ['trendAnalysis', 'predictions', 'opportunities', 'risks', 'recommendations']
      },
      temperature: 0.7,
    })

    return NextResponse.json({
      metrics: {
        totalInquiries,
        totalContacts,
        totalBookings,
        conversionRate,
        inquiryGrowth,
      },
      insights: insights || {
        trendAnalysis: "Analyzing recent lead generation patterns...",
        predictions: [],
        opportunities: [],
        risks: [],
        recommendations: [],
      },
      trendData,
    })
  } catch (error) {
    console.error('Predictive insights API error:', error)
    // Return fallback empty insights if database is unreachable
    return NextResponse.json({
      metrics: {
        totalInquiries: 0,
        totalContacts: 0,
        totalBookings: 0,
        conversionRate: 0,
        inquiryGrowth: 0,
      },
      insights: {
        trendAnalysis: "Database temporarily unavailable. Check back soon.",
        predictions: [],
        opportunities: [],
        risks: [],
        recommendations: [],
      },
      trendData: [],
    })
  }
}