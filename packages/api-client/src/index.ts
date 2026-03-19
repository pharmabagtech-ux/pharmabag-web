// Core API client
export { api, setAccessToken, getAccessToken } from './api';

// Auth
export {
  sendOtp,
  verifyOtp,
  refreshToken,
  logout,
  getProfile,
  type User,
  type SendOtpRequest,
  type SendOtpResponse,
  type VerifyOtpRequest,
  type VerifyOtpResponse,
} from './modules/auth.api';

// Auth Context
export { AuthProvider, useAuth } from './auth/auth-provider';

// Products
export {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type ProductListResponse,
  type CreateProductInput,
  type Category,
} from './modules/products.api';

// Cart
export {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type Cart,
  type CartItem,
} from './modules/cart.api';

// Orders
export {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  updateOrderStatus,
  type Order,
  type OrderItem,
  type OrderListResponse,
  type CreateOrderInput,
} from './modules/orders.api';

// Payments
export {
  createPayment,
  uploadPaymentProof,
  getPaymentByOrderId,
  getPaymentHistory,
  type Payment,
  type CreatePaymentInput,
} from './modules/payments.api';

// Notifications
export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
  type NotificationListResponse,
} from './modules/notifications.api';

// Reviews
export {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  type Review,
  type ReviewListResponse,
  type CreateReviewInput,
} from './modules/reviews.api';

// Tickets
export {
  getTickets,
  getTicketById,
  createTicket,
  addTicketMessage,
  closeTicket,
  type Ticket,
  type TicketMessage,
  type TicketListResponse,
  type CreateTicketInput,
} from './modules/tickets.api';

// Buyer Profile
export {
  getBuyerProfile,
  createBuyerProfile,
  updateBuyerProfile,
  type BuyerProfile,
  type CreateBuyerProfileInput,
  type UpdateBuyerProfileInput,
} from './modules/buyers.api';

// Storage
export {
  uploadPaymentProofFile,
  uploadKycDocument,
} from './modules/storage.api';
