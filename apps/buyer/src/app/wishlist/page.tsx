'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import AuthGuard from '@/components/shared/AuthGuard';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/LoaderSkeleton';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useGuardedAddToCart } from '@/hooks/usePurchaseAccess';
import { useToast } from '@/components/shared/Toast';
import { formatSchemeTag, productSlug } from '@pharmabag/utils';
import PremiumProductCard from '@/components/shared/PremiumProductCard';
import { listingNetRate, effectiveMinQuantity } from '@/lib/pricing';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';

export default function WishlistPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { data: wishlist, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useGuardedAddToCart();
  const { toast } = useToast();
  const router = useRouter();
  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 20000;

  const items = wishlist?.items ?? [];

  const handleRemove = (productId: string) => {
    removeFromWishlist.mutate(productId, {
      onSuccess: () => toast('Removed from wishlist', 'success'),
      onError: () => toast('Failed to remove item', 'error'),
    });
  };

  const handleAddToCart = (item: any, quantity?: number) => {
    const product = item.product || {};
    const image =
      (typeof product.images?.[0] === 'string'
        ? product.images[0]
        : (product.images?.[0] as any)?.url) || '/products/pharma_bottle.png';
    const minQty = effectiveMinQuantity(product, minOrderAmount);
    addToCart.mutate({
      productId: item.productId,
      quantity: quantity ?? minQty,
      productName: product.name,
      slug: productSlug({ ...product, id: product?.id ?? item.productId }),
      price: product.price || listingNetRate(product) || product.mrp || 0,
      mrp: product.mrp || 0,
      gstPercent: product.gstPercent,
      // Carried through so the bag can show the full price breakup for
      // anything saved and then added from here.
      discountType: product.discountType,
      discountMeta: product.discountMeta,
      stock: product.stock,
      moq: minQty,
      imageUrl: image,
    }, {
      onError: () => toast('Failed to add to bag', 'error'),
    });
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-pink-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

        <Navbar showUserActions onLoginClick={() => setIsLoginOpen(true)} />

        <div className="pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-20 px-[4vw] w-full mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={Heart}
              title="Unable to load wishlist"
              description="Please try again later"
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Save products you love and come back to them later"
              actionLabel="Browse Products"
              actionHref="/products"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {items.map((item: any) => {
                  const product = item.product ?? {};
                  const image =
                    (typeof product.images?.[0] === 'string'
                      ? product.images[0]
                      : (product.images?.[0] as any)?.url) || '/products/pharma_bottle.png';
                  const moq = effectiveMinQuantity(product, minOrderAmount);
                  // Saved items carry the raw listing, so the rate is derived
                  // the same way the featured strip derives it.
                  const price = product.price || listingNetRate(product) || product.mrp || 0;
                  const openProduct = () =>
                    router.push(`/products/${productSlug({ ...product, id: product?.id ?? item.productId })}`);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <PremiumProductCard
                        name={product?.name ?? 'Product'}
                        price={price}
                        mrp={product.mrp}
                        image={image}
                        moq={moq}
                        stock={product.stock ?? 999}
                        discountTag={formatSchemeTag(product.discountType, product.discountMeta)}
                        productId={item.productId}
                        // A saved item is a seller's listing, so it always has a
                        // seller; without this every figure renders as N/A.
                        product={{ ...product, sellerCount: 1, bestListingId: item.productId }}
                        // The ribbon is already filled here, and clearing it is
                        // what "remove from wishlist" means on this page.
                        isBookmarked
                        onBookmark={(bookmarked) => {
                          if (!bookmarked) handleRemove(item.productId);
                        }}
                        isLoadingCart={addToCart.isPending}
                        onCartChange={(quantity) => {
                          if (quantity && quantity > 0) handleAddToCart(item, quantity);
                        }}
                        onQuickView={openProduct}
                        onClick={openProduct}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
<LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </main>
    </AuthGuard>
  );
}
