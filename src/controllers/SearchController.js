import searchService from "../services/SearchService.js";
import productService from "../services/ProductService.js";

const searchProducts = async (req, res, next) => {
	try {
		const query = req.query.query || "";
		const limit = parseInt(req.query.limit) || 50;

		if (!query || query.trim().length === 0) {
			return res.status(400).json({
				success: false,
				error: {
					message: "Query parameter is required",
				},
			});
		}

		const products = searchService.searchProducts(query, limit);

		const formattedProducts = products.map((product) => ({
			productId: product.productId,
			title: product.title,
			description: product.description,
			mrp: product.mrp,
			sellingPrice: product.sellingPrice,
			metadata: product.metadata,
			stock: product.stock,
			rating: product.rating,
			brand: product.brand,
			category: product.category,
		}));

		res.json({
			success: true,
			data: formattedProducts,
			count: formattedProducts.length,
		});
	} catch (error) {
		next(error);
	}
};

const getSearchSuggestions = async (req, res, next) => {
	try {
		const query = req.query.query || "";
		const limit = parseInt(req.query.limit) || 10;

		if (!query || query.length < 2) {
			return res.json({
				success: true,
				data: [],
			});
		}

		const suggestions = searchService.getSearchSuggestions(query, limit);

		res.json({
			success: true,
			data: suggestions,
		});
	} catch (error) {
		next(error);
	}
};

const getSearchFilters = async (req, res, next) => {
	try {
		const brands = new Set();
		const categories = new Set();
		const prices = [];

		const allProducts = productService.getAllProductsUnpaginated();
		allProducts.forEach((product) => {
			if (product.brand && product.brand !== "unknown") {
				brands.add(product.brand);
			}
			if (product.category) {
				categories.add(product.category);
			}
			if (product.price) {
				prices.push(product.price);
			}
		});

		const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
		const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

		res.json({
			success: true,
			data: {
				brands: Array.from(brands).sort(),
				categories: Array.from(categories).sort(),
				priceRange: {
					min: minPrice,
					max: maxPrice,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

export { searchProducts, getSearchSuggestions, getSearchFilters };
