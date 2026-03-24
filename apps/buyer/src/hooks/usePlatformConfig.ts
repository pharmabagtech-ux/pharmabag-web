'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlatformConfig, type PlatformConfig } from '@pharmabag/api-client';

const DEFAULTS: PlatformConfig = {
  gst_rate: 12,
  min_order_amount: 20000,
  shipping_threshold: 5000,
  shipping_fee: 250,
  default_moq: 1,
  max_order_qty: 100,
};

export function usePlatformConfig() {
  return useQuery({
    queryKey: ['platform-config'],
    queryFn: getPlatformConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    placeholderData: DEFAULTS,
  });
}
