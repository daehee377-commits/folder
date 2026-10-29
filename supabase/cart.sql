-- Supabase 대시보드 > SQL Editor 에서 한 번 실행하세요.
create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

-- 본인 장바구니 행만 조회/추가/수정/삭제 가능 (재실행해도 오류 없도록 먼저 삭제)
drop policy if exists "cart_select_own" on public.cart_items;
drop policy if exists "cart_insert_own" on public.cart_items;
drop policy if exists "cart_update_own" on public.cart_items;
drop policy if exists "cart_delete_own" on public.cart_items;

create policy "cart_select_own" on public.cart_items
  for select to authenticated using (user_id = auth.uid());
create policy "cart_insert_own" on public.cart_items
  for insert to authenticated with check (user_id = auth.uid());
create policy "cart_update_own" on public.cart_items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cart_delete_own" on public.cart_items
  for delete to authenticated using (user_id = auth.uid());
