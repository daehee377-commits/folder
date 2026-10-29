import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { won } from '../data/products'

export default function Cart() {
  const { items, total, error, setQuantity, remove, clear } = useCart()

  return (
    <section className="section">
      <h2>장바구니</h2>
      {error && <p className="error">{error}</p>}
      {items.length === 0 ? (
        <p className="center">장바구니가 비어 있어요. <Link to="/shop">굿즈샵 가기</Link></p>
      ) : (
        <>
          <ul className="cart">
            {items.map((i) => (
              <li key={i.id}>
                <span className="name">{i.name}</span>
                <span className="qty">
                  <button onClick={() => setQuantity(i.id, i.quantity - 1)} aria-label="수량 감소">−</button>
                  {i.quantity}
                  <button onClick={() => setQuantity(i.id, i.quantity + 1)} aria-label="수량 증가">+</button>
                </span>
                <span className="sum">{won(i.price * i.quantity)}</span>
                <button className="link" onClick={() => remove(i.id)}>삭제</button>
              </li>
            ))}
          </ul>
          <div className="total">
            <button className="link" onClick={clear}>비우기</button>
            <b>합계 {won(total)}</b>
            <button className="btn" onClick={() => alert('결제 기능은 아직 준비 중입니다.')}>주문하기</button>
          </div>
        </>
      )}
    </section>
  )
}
