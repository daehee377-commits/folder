// 제주 IP 굿즈 샘플 상품. image는 Pixabay 검색어로 불러옵니다.
export const PRODUCTS = [
  { id: 'dolhareubang-figure', name: '돌하르방 피규어', price: 18000, query: 'dol hareubang statue' },
  { id: 'haenyeo-ecobag', name: '해녀 에코백', price: 12000, query: 'jeju haenyeo' },
  { id: 'tangerine-box', name: '제주 감귤 한 박스', price: 25000, query: 'jeju tangerine' },
  { id: 'hallasan-poster', name: '한라산 포스터', price: 9000, query: 'hallasan' },
  { id: 'oreum-postcard', name: '오름 엽서 세트', price: 6000, query: 'jeju oreum' },
  { id: 'sunrise-mug', name: '성산일출봉 머그컵', price: 14000, query: 'seongsan ilchulbong' },
  { id: 'canola-sticker', name: '유채꽃 스티커팩', price: 4000, query: 'jeju canola flower' },
  { id: 'jeju-horse-keyring', name: '제주 조랑말 키링', price: 7000, query: 'jeju pony horse' },
]

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]))

export const won = (n) => `${n.toLocaleString('ko-KR')}원`
