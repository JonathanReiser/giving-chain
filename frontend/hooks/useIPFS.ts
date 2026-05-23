'use client'

import { useState, useEffect } from 'react'
import { ipfsUrl } from '@/lib/contracts'

export function useIPFSData<T>(cid: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cid) return
    setLoading(true)
    // Try Pinata gateway first, fall back to ipfs.io
    const url = cid.startsWith('Qm') || cid.startsWith('bafy')
      ? ipfsUrl(cid)
      : null
    if (!url) { setLoading(false); return }
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [cid])

  return { data, loading }
}
