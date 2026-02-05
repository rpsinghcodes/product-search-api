/**
 * Query Processor Service
 * Handles query normalization, spelling correction, Hinglish support, and intent extraction
 */

import leven from "leven";
import constants from "../utils/constants.js";

const { HINGLISH_MAPPINGS, SPELLING_CORRECTIONS, PRICE_KEYWORDS } = constants;

class QueryProcessor {
	constructor() {
		// Common product brands for spelling correction
		this.brands = [
			"iphone",
			"samsung",
			"oneplus",
			"xiaomi",
			"redmi",
			"oppo",
			"vivo",
			"realme",
			"nokia",
		];

		// Common product terms
		this.productTerms = [
			"phone",
			"mobile",
			"laptop",
			"headphone",
			"charger",
			"cover",
			"case",
			"screen",
			"guard",
		];
	}

	/**
	 * Correct spelling mistakes in query
	 */
	correctSpelling(query) {
		let corrected = query.toLowerCase();

		// Apply known spelling corrections
		Object.keys(SPELLING_CORRECTIONS).forEach((mistake) => {
			const regex = new RegExp(`\\b${mistake}\\b`, "gi");
			corrected = corrected.replace(regex, SPELLING_CORRECTIONS[mistake]);
		});

		// Check against known brands and terms
		const words = corrected.split(/\s+/);
		const correctedWords = words.map((word) => {
			// Check against brands
			for (const brand of this.brands) {
				const distance = leven(word, brand);
				if (distance <= 2 && distance > 0 && word.length > 3) {
					return brand;
				}
			}

			// Check against product terms
			for (const term of this.productTerms) {
				const distance = leven(word, term);
				if (distance <= 2 && distance > 0 && word.length > 3) {
					return term;
				}
			}

			return word;
		});

		return correctedWords.join(" ");
	}

	/**
	 * Translate Hinglish to English
	 */
	translateHinglish(query) {
		let translated = query.toLowerCase();

		Object.keys(HINGLISH_MAPPINGS).forEach((hindiWord) => {
			const regex = new RegExp(`\\b${hindiWord}\\b`, "gi");
			translated = translated.replace(regex, HINGLISH_MAPPINGS[hindiWord]);
		});

		return translated;
	}

	/**
	 * Extract price range from query
	 */
	extractPriceRange(query) {
		const pricePatterns = [
			/(\d+)\s*(k|thousand|thousands)\s*(rupees?|rs\.?)?/gi,
			/(\d+)\s*(lakh|lac)\s*(rupees?|rs\.?)?/gi,
			/(\d+)\s*(rupees?|rs\.?)/gi,
			/under\s*(\d+)\s*(k|thousand)?/gi,
			/below\s*(\d+)\s*(k|thousand)?/gi,
			/upto\s*(\d+)\s*(k|thousand)?/gi,
			/max\s*(\d+)\s*(k|thousand)?/gi,
		];

		let minPrice = null;
		let maxPrice = null;

		for (const pattern of pricePatterns) {
			const matches = query.match(pattern);
			if (matches) {
				for (const match of matches) {
					const numberMatch = match.match(/(\d+)/);
					if (numberMatch) {
						let value = parseInt(numberMatch[1]);

						// Check for k/thousand multiplier
						if (
							match.toLowerCase().includes("k") ||
							match.toLowerCase().includes("thousand")
						) {
							value *= 1000;
						} else if (
							match.toLowerCase().includes("lakh") ||
							match.toLowerCase().includes("lac")
						) {
							value *= 100000;
						}

						// Check for max/under/below/upto keywords
						if (
							match.toLowerCase().includes("under") ||
							match.toLowerCase().includes("below") ||
							match.toLowerCase().includes("upto") ||
							match.toLowerCase().includes("max")
						) {
							maxPrice = value;
						} else {
							// Default: treat as max price
							maxPrice = value;
						}
					}
				}
			}
		}

		return { minPrice, maxPrice };
	}

	/**
	 * Extract color from query
	 */
	extractColor(query) {
		const colors = [
			"red",
			"blue",
			"green",
			"yellow",
			"black",
			"white",
			"silver",
			"gold",
			"pink",
			"purple",
			"orange",
			"grey",
			"gray",
			"brown",
			"starlight",
			"cosmic orange",
			"deep blue",
			"sky blue",
			"space black",
			"space gray",
		];

		const lowerQuery = query.toLowerCase();
		for (const color of colors) {
			if (lowerQuery.includes(color.toLowerCase())) {
				return color;
			}
		}

		return null;
	}

	/**
	 * Extract model number from query
	 */
	extractModel(query) {
		// iPhone patterns
		const iphonePattern = /iphone\s*(\d+)\s*(pro|max|plus|air)?/gi;
		const iphoneMatch = query.match(iphonePattern);
		if (iphoneMatch) {
			return iphoneMatch[0].trim();
		}

		// Samsung patterns
		const samsungPattern = /galaxy\s+s(\d+)/gi;
		const samsungMatch = query.match(samsungPattern);
		if (samsungMatch) {
			return samsungMatch[0].trim();
		}

		// Generic number pattern
		const numberPattern = /\b(\d+)\b/;
		const numberMatch = query.match(numberPattern);
		if (numberMatch) {
			return numberMatch[1];
		}

		return null;
	}

	/**
	 * Extract brand from query
	 */
	extractBrand(query) {
		const brands = [
			"iphone",
			"apple",
			"samsung",
			"oneplus",
			"xiaomi",
			"redmi",
			"oppo",
			"vivo",
			"realme",
			"nokia",
		];
		const lowerQuery = query.toLowerCase();

		for (const brand of brands) {
			if (lowerQuery.includes(brand)) {
				return brand === "iphone" ? "apple" : brand;
			}
		}

		return null;
	}

	/**
	 * Extract intent from query
	 */
	extractIntent(query) {
		const lowerQuery = query.toLowerCase();
		const intent = {
			sortBy: null,
			filterBy: {},
			searchTerms: [],
		};

		// Check for "latest" intent
		if (
			lowerQuery.includes("latest") ||
			lowerQuery.includes("new") ||
			lowerQuery.includes("newest")
		) {
			intent.sortBy = "latest";
		}

		// Check for "cheap" or "sasta" intent
		if (
			lowerQuery.includes("cheap") ||
			lowerQuery.includes("sasta") ||
			lowerQuery.includes("sastha") ||
			lowerQuery.includes("affordable") ||
			lowerQuery.includes("budget")
		) {
			intent.sortBy = "price_asc";
		}

		// Check for "best" intent
		if (lowerQuery.includes("best") || lowerQuery.includes("top")) {
			intent.sortBy = "rating";
		}

		// Extract filters
		const color = this.extractColor(query);
		if (color) {
			intent.filterBy.color = color;
		}

		const model = this.extractModel(query);
		if (model) {
			intent.filterBy.model = model;
		}

		const brand = this.extractBrand(query);
		if (brand) {
			intent.filterBy.brand = brand;
		}

		const priceRange = this.extractPriceRange(query);
		if (priceRange.minPrice || priceRange.maxPrice) {
			intent.filterBy.priceRange = priceRange;
		}

		// Extract search terms (remove filter keywords)
		const filterKeywords = [
			"latest",
			"new",
			"cheap",
			"sasta",
			"best",
			"top",
			"red",
			"blue",
			"black",
			"white",
			"color",
			"rupees",
			"rs",
			"k",
			"thousand",
			"lakh",
			"under",
			"below",
			"upto",
			"max",
		];
		const words = query.toLowerCase().split(/\s+/);
		intent.searchTerms = words.filter((word) => {
			return word.length > 2 && !filterKeywords.includes(word);
		});

		return intent;
	}

	/**
	 * Normalize query
	 */
	normalizeQuery(query) {
		if (!query || typeof query !== "string") {
			return "";
		}

		// Remove special characters except spaces
		let normalized = query.replace(/[^\w\s]/g, " ");

		// Convert to lowercase
		normalized = normalized.toLowerCase();

		// Remove extra spaces
		normalized = normalized.replace(/\s+/g, " ").trim();

		return normalized;
	}

	/**
	 * Process query: normalize, correct spelling, translate Hinglish, extract intent
	 */
	processQuery(query) {
		if (!query) {
			return {
				original: "",
				normalized: "",
				corrected: "",
				intent: {},
			};
		}

		// Step 1: Normalize
		let normalized = this.normalizeQuery(query);

		// Step 2: Translate Hinglish
		let translated = this.translateHinglish(normalized);

		// Step 3: Correct spelling
		let corrected = this.correctSpelling(translated);

		// Step 4: Extract intent
		const intent = this.extractIntent(corrected);

		return {
			original: query,
			normalized: normalized,
			corrected: corrected,
			intent: intent,
		};
	}
}

// Singleton instance
const queryProcessor = new QueryProcessor();

export default queryProcessor;
