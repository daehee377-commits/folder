import { useEffect, useState } from 'react'

export function usePixabay(query, perPage = 24) {
  const [hits, setHits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetch(`/api/pixabay?q=${encodeURIComponent(query)}&per_page=${perPage}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || '요청 실패')
        if (!cancelled) setHits(data.hits)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [query, perPage])

  return { hits, loading, error }
}
