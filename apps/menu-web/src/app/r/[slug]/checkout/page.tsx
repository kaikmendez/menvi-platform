import { notFound } from 'next/navigation';
import { getPublicMenu } from '@/lib/api';
import { CheckoutForm } from '@/components/checkout-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  let menu;
  try {
    menu = await getPublicMenu(slug);
  } catch {
    notFound();
  }

  return <CheckoutForm menu={menu} />;
}
