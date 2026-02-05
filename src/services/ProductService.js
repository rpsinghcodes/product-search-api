import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductService {
	constructor() {
		this.products = new Map();
		this.categoryIndex = new Map();
		this.brandIndex = new Map();
		this.keywordIndex = new Map();
		this.nextProductId = 1;
		this.dataFilePath = path.join(
			__dirname,
			"../../data/amazon_products_raw.json"
		);
	}

	getNextProductId() {
		return this.nextProductId++;
	}

	productToRawFormat(product) {
		return {
			productId: product.productId,
			title: product.title,
			description: product.description,
			brand: product.brand,
			category: product.category,
			price: product.price,
			rating: product.rating,
			source: product.metadata?.source || "amazon",
			currency: product.currency,
			stock: product.stock,
		};
	}

	saveProductsToFile() {
		try {
			const allProducts = Array.from(this.products.values());
			const rawProducts = allProducts
				.map((product) => this.productToRawFormat(product))
				.sort((a, b) => a.productId - b.productId);

			const jsonContent = JSON.stringify(rawProducts, null, 2);
			fs.writeFileSync(this.dataFilePath, jsonContent, "utf8");
			return true;
		} catch (error) {
			console.error("Error saving products to file:", error.message);
			return false;
		}
	}

	addProduct(productData) {
		if (!productData.productId) {
			productData.productId = this.getNextProductId();
		} else {
			if (productData.productId >= this.nextProductId) {
				this.nextProductId = productData.productId + 1;
			}
		}

		const product = new Product(productData);
		this.products.set(product.productId, product);
		this.updateIndexes(product);
		this.saveProductsToFile();

		return product;
	}

	getProduct(productId) {
		return this.products.get(productId) || null;
	}

	updateProductMetadata(productId, metadata) {
		const product = this.products.get(productId);
		if (!product) {
			return null;
		}

		product.metadata = { ...product.metadata, ...metadata };
		product.updateSearchText();
		this.removeFromIndexes(product);
		this.updateIndexes(product);
		this.saveProductsToFile();

		return product;
	}

	deleteProduct(productId) {
		const product = this.products.get(productId);
		if (!product) {
			return false;
		}

		this.removeFromIndexes(product);
		this.products.delete(productId);
		this.saveProductsToFile();

		return true;
	}

	getAllProducts(page = 1, limit = 50) {
		const products = Array.from(this.products.values());
		const start = (page - 1) * limit;
		const end = start + limit;

		return {
			products: products.slice(start, end),
			total: products.length,
			page,
			limit,
			totalPages: Math.ceil(products.length / limit),
		};
	}

	getAllProductsUnpaginated() {
		return Array.from(this.products.values());
	}

	getProductsByCategory(category) {
		const productIds =
			this.categoryIndex.get(category.toLowerCase()) || new Set();
		return Array.from(productIds)
			.map((id) => this.products.get(id))
			.filter((p) => p !== undefined);
	}

	getProductsByBrand(brand) {
		const productIds = this.brandIndex.get(brand.toLowerCase()) || new Set();
		return Array.from(productIds)
			.map((id) => this.products.get(id))
			.filter((p) => p !== undefined);
	}

	getProductsByKeyword(keyword) {
		const productIds =
			this.keywordIndex.get(keyword.toLowerCase()) || new Set();
		return Array.from(productIds)
			.map((id) => this.products.get(id))
			.filter((p) => p !== undefined);
	}

	searchProductsByText(searchText) {
		const keywords = searchText
			.toLowerCase()
			.split(/\s+/)
			.filter((k) => k.length > 2 || /^\d+$/.test(k));
		const productSets = keywords.map((k) => this.getProductsByKeyword(k));

		if (productSets.length === 0) {
			return [];
		}

		let resultSet = new Set(productSets[0].map((p) => p.productId));
		for (let i = 1; i < productSets.length; i++) {
			const currentSet = new Set(productSets[i].map((p) => p.productId));
			resultSet = new Set([...resultSet].filter((id) => currentSet.has(id)));
		}

		if (resultSet.size === 0) {
			resultSet = new Set();
			productSets.forEach((set) => {
				set.forEach((p) => resultSet.add(p.productId));
			});
		}

		return Array.from(resultSet).map((id) => this.products.get(id));
	}

	getProductCount() {
		return this.products.size;
	}

	updateIndexes(product) {
		const category = product.category.toLowerCase();
		if (!this.categoryIndex.has(category)) {
			this.categoryIndex.set(category, new Set());
		}
		this.categoryIndex.get(category).add(product.productId);

		const brand = product.brand.toLowerCase();
		if (!this.brandIndex.has(brand)) {
			this.brandIndex.set(brand, new Set());
		}
		this.brandIndex.get(brand).add(product.productId);

		product.searchKeywords.forEach((keyword) => {
			if (!this.keywordIndex.has(keyword)) {
				this.keywordIndex.set(keyword, new Set());
			}
			this.keywordIndex.get(keyword).add(product.productId);
		});
	}

	removeFromIndexes(product) {
		const category = product.category.toLowerCase();
		if (this.categoryIndex.has(category)) {
			this.categoryIndex.get(category).delete(product.productId);
			if (this.categoryIndex.get(category).size === 0) {
				this.categoryIndex.delete(category);
			}
		}

		const brand = product.brand.toLowerCase();
		if (this.brandIndex.has(brand)) {
			this.brandIndex.get(brand).delete(product.productId);
			if (this.brandIndex.get(brand).size === 0) {
				this.brandIndex.delete(brand);
			}
		}

		product.searchKeywords.forEach((keyword) => {
			if (this.keywordIndex.has(keyword)) {
				this.keywordIndex.get(keyword).delete(product.productId);
				if (this.keywordIndex.get(keyword).size === 0) {
					this.keywordIndex.delete(keyword);
				}
			}
		});
	}

	clearAll() {
		this.products.clear();
		this.categoryIndex.clear();
		this.brandIndex.clear();
		this.keywordIndex.clear();
		this.nextProductId = 1;
	}
}

const productService = new ProductService();

export default productService;
