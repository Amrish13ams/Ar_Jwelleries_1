import 'package:flutter/material.dart';

/// A small button to be placed in the bottom right of the screen.
/// When clicked, it shows the product catalog.
class ProductCatalogButton extends StatelessWidget {
  const ProductCatalogButton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      mini: true, // Creates a smaller button as requested
      backgroundColor: Colors.white,
      onPressed: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          builder: (context) => const ProductCatalogSheet(),
        );
      },
      child: const Icon(Icons.grid_view_rounded, color: Colors.black),
    );
  }
}

/// The bottom sheet widget that displays the three products.
class ProductCatalogSheet extends StatelessWidget {
  const ProductCatalogSheet({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 350,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const Text(
            "Product Catalog",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildProductItem("Necklace", "assets/necless-removebg-preview.png"),
                _buildProductItem("Ring", "assets/ring-removebg-preview.png"),
                _buildProductItem("Earring", "assets/earing-removebg-preview.png"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductItem(String name, String assetPath) {
    return Column(
      children: [
        Expanded(
          child: Container(
            width: 90,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Image.asset(
              assetPath,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(Icons.image_not_supported, color: Colors.grey);
              },
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}