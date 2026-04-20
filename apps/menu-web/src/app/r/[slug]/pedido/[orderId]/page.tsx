import { OrderTracker } from '@/components/order-tracker';

interface PageProps {
  params: Promise<{ slug: string; orderId: string }>;
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { slug, orderId } = await params;
  return <OrderTracker slug={slug} orderId={orderId} />;
}
