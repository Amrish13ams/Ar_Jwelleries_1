'use client';

import { Drawer } from 'vaul';
import { LayoutGrid } from 'lucide-react';
import Image from 'next/image';

type Product = {
  name: 'Necklace' | 'Ring' | 'Earring';
  image: string;
};

interface ProductCatalogProps {
  onProductSelect: (product: Product) => void;
}

export function ProductCatalog({ onProductSelect }: ProductCatalogProps) {
  const products = [
    { name: 'Necklace', image: '/necless-removebg-preview.png' },
    { name: 'Ring', image: '/ring-removebg-preview.png' },
    { name: 'Earring', image: '/earing-removebg-preview.png' },
  ] as const;

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <button className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 transition-transform hover:scale-105 active:scale-95">
          <LayoutGrid className="h-6 w-6 text-black" />
          <span className="sr-only">Open Catalog</span>
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[350px] flex-col rounded-t-[10px] bg-white outline-none">
          <div className="flex-1 rounded-t-[10px] bg-white p-4">
            <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
            <div className="mx-auto max-w-md">
              <Drawer.Title className="mb-6 text-center text-xl font-bold text-gray-900">
                Product Catalog
              </Drawer.Title>
              <div className="grid grid-cols-3 gap-4">
                {products.map((product) => (
                  <Drawer.Close asChild key={product.name}>
                    <button
                      onClick={() => onProductSelect(product)}
                      className="flex flex-col items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <div className="relative h-full w-full">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{product.name}</span>
                    </button>
                  </Drawer.Close>
                ))}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}