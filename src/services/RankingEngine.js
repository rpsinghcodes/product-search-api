/**
 * Ranking Engine Service
 * Implements multi-factor ranking algorithm for search results
 */

import leven from "leven";
import constants from "../utils/constants.js";

const {
	RANKING_WEIGHTS,
	RELEVANCE_WEIGHTS,
	QUALITY_WEIGHTS,
	POPULARITY_WEIGHTS,
	SEARCH_CONFIG,
} = constants;

class RankingEngine {
	/**
	 * Calculate relevance score (0-1)
	 */
	calculateRelevanceScore(product, query, processedQuery) {
		let score = 0;
		const searchText = product.searchText.toLowerCase();
		const queryLower = query.toLowerCase();
		const correctedQuery = processedQuery.corrected.toLowerCase();
		const keywords = correctedQuery.split(/\s+/).filter((k) => k.length > 2);

		// Title match
		const titleLower = product.title.toLowerCase();
		if (titleLower.includes(queryLower)) {
			score += RELEVANCE_WEIGHTS.TITLE_MATCH;
		} else {
			// Partial match in title
			const titleMatchCount = keywords.filter((k) =>
				titleLower.includes(k)
			).length;
			if (titleMatchCount > 0) {
				score +=
					RELEVANCE_WEIGHTS.TITLE_MATCH * (titleMatchCount / keywords.length);
			}
		}

		// Description match
		const descLower = product.description.toLowerCase();
		const descMatchCount = keywords.filter((k) => descLower.includes(k)).length;
		if (descMatchCount > 0) {
			score +=
				RELEVANCE_WEIGHTS.DESCRIPTION_MATCH *
				(descMatchCount / keywords.length);
		}

		// Metadata match
		const metadataText = Object.values(product.metadata)
			.filter((v) => typeof v === "string")
			.join(" ")
			.toLowerCase();
		const metadataMatchCount = keywords.filter((k) =>
			metadataText.includes(k)
		).length;
		if (metadataMatchCount > 0) {
			score +=
				RELEVANCE_WEIGHTS.METADATA_MATCH *
				(metadataMatchCount / keywords.length);
		}

		// Exact match bonus
		if (titleLower === queryLower || titleLower.includes(queryLower)) {
			score += RELEVANCE_WEIGHTS.EXACT_MATCH_BONUS;
		}

		// Brand match bonus
		const intent = processedQuery.intent;
		if (intent.filterBy.brand) {
			const productBrand = product.brand.toLowerCase();
			if (productBrand === intent.filterBy.brand.toLowerCase()) {
				score += RELEVANCE_WEIGHTS.BRAND_MATCH_BONUS;
			}
		}

		// Model match bonus
		if (intent.filterBy.model) {
			const productModel = product.metadata.model || "";
			if (
				productModel.toLowerCase().includes(intent.filterBy.model.toLowerCase())
			) {
				score += RELEVANCE_WEIGHTS.MODEL_MATCH_BONUS;
			}
		}

		// Color match bonus
		if (intent.filterBy.color) {
			const productColor = product.metadata.color || "";
			if (
				productColor.toLowerCase().includes(intent.filterBy.color.toLowerCase())
			) {
				score += RELEVANCE_WEIGHTS.MODEL_MATCH_BONUS; // Reuse weight
			}
		}

		// Fuzzy match for spelling variations
		const fuzzyMatch = this.calculateFuzzyMatch(product, keywords);
		score += fuzzyMatch * 0.1; // 10% weight for fuzzy matches

		return Math.min(1, score);
	}

	/**
	 * Calculate fuzzy match score
	 */
	calculateFuzzyMatch(product, keywords) {
		let matchScore = 0;
		const productText = product.searchText.toLowerCase();

		keywords.forEach((keyword) => {
			const productWords = productText.split(/\s+/);
			productWords.forEach((word) => {
				if (word.length > 3 && keyword.length > 3) {
					const distance = leven(word, keyword);
					if (distance <= SEARCH_CONFIG.FUZZY_THRESHOLD && distance > 0) {
						matchScore +=
							(1 - distance / SEARCH_CONFIG.FUZZY_THRESHOLD) / keywords.length;
					}
				}
			});
		});

		return Math.min(1, matchScore);
	}

	/**
	 * Calculate quality score (0-1)
	 */
	calculateQualityScore(product) {
		let score = 0;

		// Rating (normalized to 0-1)
		const ratingScore = product.rating / 5;
		score += ratingScore * QUALITY_WEIGHTS.RATING;

		// Review count (normalized)
		const maxReviews = 10000; // Assume max 10k reviews
		const reviewScore = Math.min(1, product.reviewCount / maxReviews);
		score += reviewScore * QUALITY_WEIGHTS.REVIEW_COUNT;

		// Return rate (inverse - lower is better)
		const returnScore = 1 - product.returnRate;
		score += returnScore * QUALITY_WEIGHTS.RETURN_RATE;

		// Complaint count (inverse - normalized)
		const maxComplaints = 1000;
		const complaintScore =
			1 - Math.min(1, product.complaintCount / maxComplaints);
		score += complaintScore * QUALITY_WEIGHTS.COMPLAINT_COUNT;

		// Stock availability
		const stockScore = product.stock > 0 ? 1 : 0;
		score += stockScore * QUALITY_WEIGHTS.STOCK_AVAILABILITY;

		return Math.min(1, score);
	}

	/**
	 * Calculate popularity score (0-1)
	 */
	calculatePopularityScore(product) {
		let score = 0;

		// Units sold (normalized)
		const maxUnitsSold = 100000;
		const unitsScore = Math.min(1, product.unitsSold / maxUnitsSold);
		score += unitsScore * POPULARITY_WEIGHTS.UNITS_SOLD;

		// Discount percentage (normalized)
		const discountScore = Math.min(1, product.discountPercentage / 50); // Max 50% discount
		score += discountScore * POPULARITY_WEIGHTS.DISCOUNT_PERCENTAGE;

		// Latest model flag
		const latestScore = product.isLatest ? 1 : 0;
		score += latestScore * POPULARITY_WEIGHTS.IS_LATEST;

		return Math.min(1, score);
	}

	/**
	 * Apply special ranking boosts based on query intent
	 */
	applySpecialBoosts(product, processedQuery) {
		let boost = 0;
		const intent = processedQuery.intent;

		// Price range boost
		if (intent.filterBy.priceRange) {
			const { minPrice, maxPrice } = intent.filterBy.priceRange;
			if (maxPrice && product.price <= maxPrice) {
				// Boost products within price range
				const priceDiff = maxPrice - product.price;
				const boostAmount = Math.min(0.2, (priceDiff / maxPrice) * 0.2);
				boost += boostAmount;
			}
		}

		// Stock boost
		if (product.stock >= SEARCH_CONFIG.MIN_STOCK_FOR_BOOST) {
			boost += 0.1;
		}

		// Latest model boost (for "latest" queries)
		if (intent.sortBy === "latest" && product.isLatest) {
			boost += 0.15;
		}

		// Exact attribute match boost
		if (intent.filterBy.color && product.metadata.color) {
			const productColor = product.metadata.color.toLowerCase();
			if (productColor.includes(intent.filterBy.color.toLowerCase())) {
				boost += 0.1;
			}
		}

		if (intent.filterBy.model && product.metadata.model) {
			const productModel = product.metadata.model.toLowerCase();
			if (productModel.includes(intent.filterBy.model.toLowerCase())) {
				boost += 0.1;
			}
		}

		return boost;
	}

	/**
	 * Calculate final ranking score for a product
	 */
	calculateRankingScore(product, query, processedQuery) {
		// Calculate component scores
		const relevanceScore = this.calculateRelevanceScore(
			product,
			query,
			processedQuery
		);
		const qualityScore = this.calculateQualityScore(product);
		const popularityScore = this.calculatePopularityScore(product);

		// Calculate weighted score
		let finalScore =
			relevanceScore * RANKING_WEIGHTS.RELEVANCE +
			qualityScore * RANKING_WEIGHTS.QUALITY +
			popularityScore * RANKING_WEIGHTS.POPULARITY;

		// Apply special boosts
		const boost = this.applySpecialBoosts(product, processedQuery);
		finalScore += boost;

		// Ensure score is between 0 and 1
		return Math.min(1, Math.max(0, finalScore));
	}

	/**
	 * Rank products based on query
	 */
	rankProducts(products, query, processedQuery) {
		// Calculate scores for all products
		const productsWithScores = products.map((product) => ({
			product,
			score: this.calculateRankingScore(product, query, processedQuery),
		}));

		// Sort by score (descending)
		productsWithScores.sort((a, b) => b.score - a.score);

		// Apply additional sorting based on intent
		const intent = processedQuery.intent;
		if (intent.sortBy === "price_asc") {
			productsWithScores.sort((a, b) => {
				if (Math.abs(b.score - a.score) < 0.01) {
					return a.product.price - b.product.price;
				}
				return b.score - a.score;
			});
		} else if (intent.sortBy === "latest") {
			productsWithScores.sort((a, b) => {
				if (Math.abs(b.score - a.score) < 0.01) {
					if (b.product.isLatest && !a.product.isLatest) return 1;
					if (a.product.isLatest && !b.product.isLatest) return -1;
					return b.product.productId - a.product.productId; // Newer IDs first
				}
				return b.score - a.score;
			});
		} else if (intent.sortBy === "rating") {
			productsWithScores.sort((a, b) => {
				if (Math.abs(b.score - a.score) < 0.01) {
					return b.product.rating - a.product.rating;
				}
				return b.score - a.score;
			});
		}

		return productsWithScores.map((item) => item.product);
	}
}

// Singleton instance
const rankingEngine = new RankingEngine();

export default rankingEngine;
