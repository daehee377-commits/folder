import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { PRODUCT_MAP } from '../data/products'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setRows([])
      return
    }
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .order('created_at')
    if (error) setError('장바구니를 불러오지 못했습니다. (cart.sql 실행 여부를 확인하세요)')
    else {
      setError('')
      setRows(data)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const run = async (promise) => {
    const { error } = await promise
    if (error) setError(error.message)
    await refresh()
  }

  const setQuantity = (productId, quantity) =>
    quantity < 1
      ? run(supabase.from('cart_items').delete().eq('product_id', productId))
      : run(
          supabase
            .from('cart_items')
            .upsert({ user_id: user.id, product_id: productId, quantity }, { onConflict: 'user_id,product_id' }),
        )

  const add = (productId) => {
    const current = rows.find((r) => r.product_id === productId)?.quantity ?? 0
    return setQuantity(productId, current + 1)
  }

  const clear = () => run(supabase.from('cart_items').delete().eq('user_id', user.id))

  const items = useMemo(
    () =>
      rows
        .filter((r) => PRODUCT_MAP[r.product_id])
        .map((r) => ({ ...PRODUCT_MAP[r.product_id], quantity: r.quantity })),
    [rows],
  )
  const count = items.reduce((s, i) => s + i.quantity, 0)
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0)

  return (
    <CartContext.Provider value={{ items, count, total, error, add, setQuantity, remove: (id) => setQuantity(id, 0), clear }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
