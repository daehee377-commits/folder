import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PRODUCTS, won } from '../data/products'
import { usePixabay } from '../hooks/usePixabay'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function ProductCard({ product }) {
  const { hits } = usePixabay(product.query, 3)
  const { user } = useAuth()
  const { add } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [added, setAdded] = useState(false)

  const onAdd = async () => {
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    await add(product.id)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="product">
      {hits[0] ? <img src={hits[0].preview} alt={product.name} loading="lazy" /> : <div className="ph" />}
      <h3>{product.name}</h3>
      <p className="price">{won(product.price)}</p>
      <button className="btn" onClick={onAdd}>{added ? '담았어요 ✓' : '장바구니 담기'}</button>
    </div>
  )
}

export default function Shop() {
  const { error } = useCart()
  return (
    <section className="section">
      <h2>제주 굿즈샵</h2>
      {error && <p className="error">{error}</p>}
      <div className="grid products">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
