/**
 * Constants and configuration
 */

export default {
	// Ranking weights
	RANKING_WEIGHTS: {
		RELEVANCE: 0.5,
		QUALITY: 0.3,
		POPULARITY: 0.2,
	},

	// Relevance score weights
	RELEVANCE_WEIGHTS: {
		TITLE_MATCH: 0.4,
		DESCRIPTION_MATCH: 0.2,
		METADATA_MATCH: 0.2,
		EXACT_MATCH_BONUS: 0.2,
		BRAND_MATCH_BONUS: 0.1,
		MODEL_MATCH_BONUS: 0.1,
	},

	// Quality score weights
	QUALITY_WEIGHTS: {
		RATING: 0.3,
		REVIEW_COUNT: 0.2,
		RETURN_RATE: 0.2,
		COMPLAINT_COUNT: 0.1,
		STOCK_AVAILABILITY: 0.2,
	},

	// Popularity score weights
	POPULARITY_WEIGHTS: {
		UNITS_SOLD: 0.4,
		DISCOUNT_PERCENTAGE: 0.3,
		IS_LATEST: 0.3,
	},

	// Search configuration
	SEARCH_CONFIG: {
		MAX_RESULTS: 100,
		DEFAULT_RESULTS: 50,
		FUZZY_THRESHOLD: 2, // Levenshtein distance threshold
		MIN_STOCK_FOR_BOOST: 1,
	},

	// Hinglish mappings
	HINGLISH_MAPPINGS: {
		sasta: "cheap",
		sastha: "cheap",
		wala: "with",
		mein: "in",
		ka: "of",
		ki: "of",
		ke: "of",
		se: "from",
		par: "on",
	},

	// Common spelling mistakes
	SPELLING_CORRECTIONS: {
		ifone: "iphone",
		ipone: "iphone",
		sastha: "sasta",
		samsung: "samsung",
		oneplus: "oneplus",
	},

	// Price keywords
	PRICE_KEYWORDS: {
		k: 1000,
		thousand: 1000,
		lakh: 100000,
		lac: 100000,
		rupees: 1,
		rs: 1,
		"rs.": 1,
	},
};
