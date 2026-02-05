import productService from "./ProductService.js";
import queryProcessor from "./QueryProcessor.js";
import rankingEngine from "./RankingEngine.js";
import constants from "../utils/constants.js";
import leven from "leven";

const { SEARCH_CONFIG } = constants;

class SearchService {
	findMatchingProducts(query, processedQuery) {
		const matches = new Set();
		const queryLower = query.toLowerCase().trim();
		const correctedQuery = processedQuery.corrected.toLowerCase();
		const keywords = correctedQuery
			.split(/\s+/)
			.filter((k) => k.length > 2 || /^\d+$/.test(k));
		const intent = processedQuery.intent;

		const allProducts = productService.getAllProductsUnpaginated();
		allProducts.forEach((product) => {
			const titleLower = product.title.toLowerCase();
			const descLower = product.description.toLowerCase();
			const searchTextLower = product.searchText.toLowerCase();

			if (titleLower.includes(queryLower) || descLower.includes(queryLower)) {
				matches.add(product.productId);
			} else if (keywords.length > 0) {
				const allKeywordsMatch = keywords.every((keyword) =>
					searchTextLower.includes(keyword)
				);
				if (allKeywordsMatch) {
					matches.add(product.productId);
				}
			}
		});

		if (keywords.length > 0) {
			keywords.forEach((keyword) => {
				const keywordMatches = productService.getProductsByKeyword(keyword);
				keywordMatches.forEach((p) => matches.add(p.productId));
			});
		}

		if (intent.filterBy.brand) {
			const brandMatches = productService.getProductsByBrand(
				intent.filterBy.brand
			);
			brandMatches.forEach((p) => matches.add(p.productId));
		}

		const categoryKeywords = [
			"phone",
			"mobile",
			"laptop",
			"headphone",
			"charger",
			"cover",
			"case",
		];
		const suggestedCategory = categoryKeywords.find((cat) =>
			queryLower.includes(cat)
		);
		if (suggestedCategory) {
			const categoryMatches = productService.getProductsByCategory("mobile");
			categoryMatches.forEach((p) => matches.add(p.productId));
		}

		if (matches.size === 0 || matches.size < 10) {
			allProducts.forEach((product) => {
				const productText = product.searchText.toLowerCase();

				const hasFuzzyMatch = keywords.some((keyword) => {
					const productWords = productText.split(/\s+/);
					return productWords.some((word) => {
						if (word.length > 3 && keyword.length > 3) {
							const distance = leven(word, keyword);
							return distance <= SEARCH_CONFIG.FUZZY_THRESHOLD;
						}
						return false;
					});
				});

				if (hasFuzzyMatch) {
					matches.add(product.productId);
				}
			});
		}

		const products = Array.from(matches)
			.map((id) => productService.getProduct(id))
			.filter((p) => p !== null);

		return products;
	}

	applyFilters(products, processedQuery) {
		const intent = processedQuery.intent;
		let filtered = [...products];

		if (intent.filterBy.priceRange) {
			const { minPrice, maxPrice } = intent.filterBy.priceRange;
			filtered = filtered.filter((product) => {
				if (maxPrice && product.price > maxPrice) return false;
				if (minPrice && product.price < minPrice) return false;
				return true;
			});
		}

		if (intent.filterBy.color) {
			filtered = filtered.filter((product) => {
				const productColor = (product.metadata.color || "").toLowerCase();
				return productColor.includes(intent.filterBy.color.toLowerCase());
			});
		}

		if (intent.filterBy.model) {
			filtered = filtered.filter((product) => {
				const productModel = (
					product.metadata.model ||
					product.title ||
					""
				).toLowerCase();
				return productModel.includes(intent.filterBy.model.toLowerCase());
			});
		}

		if (intent.filterBy.brand) {
			filtered = filtered.filter((product) => {
				return (
					product.brand.toLowerCase() === intent.filterBy.brand.toLowerCase()
				);
			});
		}

		return filtered;
	}

	searchProducts(query, limit = SEARCH_CONFIG.DEFAULT_RESULTS) {
		if (!query || query.trim().length === 0) {
			return [];
		}

		const processedQuery = queryProcessor.processQuery(query);
		let products = this.findMatchingProducts(query, processedQuery);

		if (products.length === 0) {
			const words = processedQuery.corrected
				.split(/\s+/)
				.filter((w) => w.length > 2 || /^\d+$/.test(w));
			if (words.length > 0) {
				products = productService.searchProductsByText(words.join(" "));
			}
		}

		products = this.applyFilters(products, processedQuery);
		products = rankingEngine.rankProducts(products, query, processedQuery);

		const maxResults = Math.min(limit, SEARCH_CONFIG.MAX_RESULTS);
		products = products.slice(0, maxResults);

		return products;
	}

	getSearchSuggestions(query, limit = 10) {
		if (!query || query.length < 2) {
			return [];
		}

		const suggestions = new Set();
		const queryLower = query.toLowerCase();
		const products = this.searchProducts(query, 50);

		products.forEach((product) => {
			const titleWords = product.title.toLowerCase().split(/\s+/);
			titleWords.forEach((word, index) => {
				if (word.startsWith(queryLower) && word.length > queryLower.length) {
					const suggestion = titleWords.slice(index, index + 3).join(" ");
					if (suggestion.length > queryLower.length) {
						suggestions.add(suggestion);
					}
				}
			});
		});

		const brands = ["iphone", "samsung", "oneplus", "xiaomi", "redmi"];
		brands.forEach((brand) => {
			if (brand.startsWith(queryLower)) {
				suggestions.add(brand);
			}
		});

		return Array.from(suggestions).slice(0, limit);
	}
}

const searchService = new SearchService();

export default searchService;
