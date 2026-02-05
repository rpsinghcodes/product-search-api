/**
 * Data Loader Utility
 * Loads and transforms scraped product data into Product models
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import productService from "../services/ProductService.js";
import { extractMetadata } from "./metadataExtractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate synthetic units sold based on rating and price
 */
const generateUnitsSold = (rating, price) => {
	// Higher rating = more sales
	// Lower price = more sales
	const baseSales = 1000;
	const ratingMultiplier = rating * 2000; // 4.5 rating = 9000 base
	const priceFactor = Math.max(0.1, 1 - price / 200000); // Cheaper = more sales

	const sales = baseSales + ratingMultiplier * priceFactor;
	// Add some randomness
	const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
	return Math.floor(sales * randomFactor);
};

/**
 * Generate return rate based on rating
 */
const generateReturnRate = (rating) => {
	// Lower rating = higher return rate
	const baseReturnRate = 0.15; // 15% base
	const ratingPenalty = (5 - rating) * 0.02; // Each star less = 2% more returns
	const randomVariation = (Math.random() - 0.5) * 0.05; // ±2.5% variation

	return Math.max(
		0.01,
		Math.min(0.25, baseReturnRate - ratingPenalty + randomVariation)
	);
};

/**
 * Generate review count based on units sold and rating
 */
const generateReviewCount = (unitsSold, rating) => {
	// Higher sales = more reviews, but with diminishing returns
	// Higher rating = slightly more reviews (satisfied customers review more)
	const reviewRate = 0.05 + (rating - 3) * 0.02; // 5-9% review rate
	return Math.floor(unitsSold * reviewRate);
};

/**
 * Generate complaint count based on return rate and units sold
 */
const generateComplaintCount = (returnRate, unitsSold) => {
	// Complaints are a subset of returns
	const complaintRate = returnRate * 0.3; // 30% of returns become complaints
	return Math.floor(unitsSold * complaintRate);
};

/**
 * Determine if product is latest model
 */
const isLatestModel = (title, description) => {
	const text = `${title} ${description}`.toLowerCase();

	// Check for iPhone models (17 is latest)
	if (text.includes("iphone")) {
		const modelMatch = text.match(/iphone\s*(\d+)/i);
		if (modelMatch) {
			const modelNum = parseInt(modelMatch[1]);
			return modelNum >= 16; // iPhone 16+ considered latest
		}
	}

	// Check for Samsung Galaxy S series
	if (text.includes("galaxy s")) {
		const modelMatch = text.match(/galaxy\s+s(\d+)/i);
		if (modelMatch) {
			const modelNum = parseInt(modelMatch[1]);
			return modelNum >= 23; // S23+ considered latest
		}
	}

	// Check for OnePlus
	if (text.includes("oneplus")) {
		const modelMatch = text.match(/oneplus\s+(?:nord\s*)?(\d+)/i);
		if (modelMatch) {
			const modelNum = parseInt(modelMatch[1]);
			return modelNum >= 12; // OnePlus 12+ considered latest
		}
	}

	// Default: products with high ratings and recent keywords are "latest"
	const latestKeywords = ["pro", "max", "plus", "2024", "2025"];
	return (
		latestKeywords.some((keyword) => text.includes(keyword)) &&
		(text.includes("iphone 1") || text.includes("galaxy s2"))
	);
};

/**
 * Transform raw product data to Product model format
 */
const transformProduct = (rawProduct) => {
	// Extract metadata from title and description
	const metadata = extractMetadata(
		rawProduct.title || "",
		rawProduct.description || ""
	);

	// Calculate synthetic attributes
	const rating = rawProduct.rating || 0;
	const price = rawProduct.price || 0;
	const mrp = rawProduct.mrp || rawProduct.price || price;

	const unitsSold = generateUnitsSold(rating, price);
	const returnRate = generateReturnRate(rating);
	const reviewCount = generateReviewCount(unitsSold, rating);
	const complaintCount = generateComplaintCount(returnRate, unitsSold);
	const discountPercentage = mrp > price ? ((mrp - price) / mrp) * 100 : 0;
	const isLatest = isLatestModel(
		rawProduct.title || "",
		rawProduct.description || ""
	);

	// Calculate popularity score (0-1)
	const normalizedUnitsSold = Math.min(1, unitsSold / 100000);
	const normalizedDiscount = Math.min(1, discountPercentage / 50);
	const popularityScore =
		normalizedUnitsSold * 0.4 + normalizedDiscount * 0.3 + (isLatest ? 0.3 : 0);

	return {
		productId: rawProduct.productId,
		title: rawProduct.title || "",
		description: rawProduct.description || "",
		brand: rawProduct.brand || "unknown",
		category: rawProduct.category || "mobile",
		price: price,
		mrp: mrp,
		sellingPrice: price,
		currency: rawProduct.currency || "Rupee",
		rating: rating,
		stock: rawProduct.stock || Math.floor(Math.random() * 1000),
		metadata: metadata,
		unitsSold: unitsSold,
		returnRate: returnRate,
		reviewCount: reviewCount,
		complaintCount: complaintCount,
		discountPercentage: discountPercentage,
		isLatest: isLatest,
		popularityScore: popularityScore,
	};
};

/**
 * Load products from JSON file
 */
const loadProductsFromFile = (filePath) => {
	try {
		const absolutePath = path.resolve(filePath);
		const fileContent = fs.readFileSync(absolutePath, "utf8");
		const rawProducts = JSON.parse(fileContent);

		if (!Array.isArray(rawProducts)) {
			throw new Error("Product data must be an array");
		}

		return rawProducts;
	} catch (error) {
		console.error(`Error loading products from ${filePath}:`, error.message);
		throw error;
	}
};

/**
 * Load and store products in memory
 */
const loadProducts = (filePath = "./data/amazon_products_raw.json") => {
	console.log(`Loading products from ${filePath}...`);

	const rawProducts = loadProductsFromFile(filePath);
	let loadedCount = 0;
	let errorCount = 0;

	rawProducts.forEach((rawProduct, index) => {
		try {
			const transformedProduct = transformProduct(rawProduct);
			productService.addProduct(transformedProduct);
			loadedCount++;
		} catch (error) {
			console.error(
				`Error transforming product at index ${index}:`,
				error.message
			);
			errorCount++;
		}
	});

	console.log(
		`Loaded ${loadedCount} products successfully. ${errorCount} errors.`
	);
	console.log(`Total products in catalog: ${productService.getProductCount()}`);

	return {
		loaded: loadedCount,
		errors: errorCount,
		total: productService.getProductCount(),
	};
};

export {
	loadProducts,
	transformProduct,
	generateUnitsSold,
	generateReturnRate,
	generateReviewCount,
	generateComplaintCount,
	isLatestModel,
};
