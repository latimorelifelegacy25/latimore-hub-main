import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    integrations: [
      { name: 'Facebook', status: 'disconnected' },
      { name: 'Instagram', status: 'disconnected' },
      { name: 'LinkedIn', status: 'disconnected' },
    ],
  })
}
