import { NextRequest, NextResponse } from 'next/server'

const PINATA_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT
  if (!jwt) {
    return NextResponse.json({ error: 'Pinata not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()

    const res = await fetch(PINATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        pinataContent: body.content,
        pinataMetadata: { name: body.name ?? 'giving-chain-upload' },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ cid: data.IpfsHash })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
