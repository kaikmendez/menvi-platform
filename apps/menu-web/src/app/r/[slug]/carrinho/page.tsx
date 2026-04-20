import { notFound } from 'next/navigation';
import { getPublicMenu } from '@/lib/api';
import { CartView } from '@/components/cart-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CartPage({ params }: PageProps) {
  const { slug } = await params;
  let menu;
  try {
    menu = await getPublicMenu(slug);
  } catch {
    notFound();
  }

  return <CartView menu={menu} />;
}
