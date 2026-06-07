export interface CartItem {
  productId: string
  name: string
  sku: string
  imageUrl: string | null
  priceSnapshot: number // MYR
  quantity: number
}

export interface WishlistItem {
  productId: string
  name: string
  sku: string
  imageUrl: string | null
  priceRetail: number
  slug: string
  stockQty: number
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'

export interface OrderItem {
  id: string
  product_id: string | null
  sku: string
  name: string
  quantity: number
  unit_price: number
  subtotal: number
  image_url: string | null
}

export interface Order {
  id: string
  order_number: string
  order_status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string | null
  subtotal: number
  shipping_fee: number
  tax_amount: number
  total: number
  delivery_name: string
  delivery_phone: string
  delivery_line1: string
  delivery_line2: string | null
  delivery_city: string
  delivery_state: string
  delivery_postcode: string
  tracking_number: string | null
  shipping_carrier: string | null
  customer_notes: string | null
  paid_at: string | null
  shipped_at: string | null
  completed_at: string | null
  created_at: string
  order_items: OrderItem[]
}
