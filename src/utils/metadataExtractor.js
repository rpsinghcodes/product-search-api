/**
 * Metadata Extractor Utility
 * Extracts product attributes from title and description using regex patterns
 */

/**
 * Extract RAM information from text
 */
const extractRAM = (text) => {
	const ramPatterns = [
		/(\d+)\s*GB\s*RAM/gi,
		/(\d+)\s*GB\s*ram/gi,
		/RAM[:\s]+(\d+)\s*GB/gi,
		/(\d+)\s*GB/gi,
	];

	for (const pattern of ramPatterns) {
		const match = text.match(pattern);
		if (match) {
			const ramMatch = match[0].match(/(\d+)\s*GB/i);
			if (ramMatch) {
				return `${ramMatch[1]}GB`;
			}
		}
	}

	return null;
};

/**
 * Extract storage information from text
 */
const extractStorage = (text) => {
	const storagePatterns = [
		/(\d+)\s*(GB|TB)\s*storage/gi,
		/(\d+)\s*(GB|TB)\s*ROM/gi,
		/storage[:\s]+(\d+)\s*(GB|TB)/gi,
		/(\d+)\s*(GB|TB)(?!\s*(RAM|ram))/gi,
	];

	// Look for storage patterns, but exclude RAM matches
	const storageMatch = text.match(/(\d+)\s*(GB|TB)(?!\s*(RAM|ram))/gi);
	if (storageMatch) {
		// Filter out RAM mentions and get the largest storage value
		const storageValues = storageMatch
			.filter((m) => !m.toLowerCase().includes("ram"))
			.map((m) => {
				const match = m.match(/(\d+)\s*(GB|TB)/i);
				if (match) {
					const value = parseInt(match[1]);
					const unit = match[2].toUpperCase();
					return unit === "TB" ? value * 1024 : value; // Convert TB to GB for comparison
				}
				return 0;
			})
			.filter((v) => v > 0);

		if (storageValues.length > 0) {
			const maxStorage = Math.max(...storageValues);
			return maxStorage >= 1024 ? `${maxStorage / 1024}TB` : `${maxStorage}GB`;
		}
	}

	return null;
};

/**
 * Extract screen size from text
 */
const extractScreenSize = (text) => {
	// Pattern for inches: "6.3 inches", "6.3\""
	const inchesPattern = /(\d+\.?\d*)\s*(?:inches|inch|"|'')/gi;
	const inchesMatch = text.match(inchesPattern);
	if (inchesMatch) {
		const sizeMatch = inchesMatch[0].match(/(\d+\.?\d*)/);
		if (sizeMatch) {
			return `${sizeMatch[1]} inches`;
		}
	}

	// Pattern for cm: "15.93 cm", "17.42 cm"
	const cmPattern = /(\d+\.?\d*)\s*cm/gi;
	const cmMatch = text.match(cmPattern);
	if (cmMatch) {
		const sizeMatch = cmMatch[0].match(/(\d+\.?\d*)/);
		if (sizeMatch) {
			// Convert cm to inches (1 inch = 2.54 cm)
			const inches = (parseFloat(sizeMatch[1]) / 2.54).toFixed(1);
			return `${inches} inches`;
		}
	}

	return null;
};

/**
 * Extract color from text
 */
const extractColor = (text) => {
	const colors = [
		"blue",
		"red",
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
		"midnight",
		"alpine green",
		"sierra blue",
		"graphite",
		"pacific blue",
	];

	const lowerText = text.toLowerCase();
	for (const color of colors) {
		if (lowerText.includes(color.toLowerCase())) {
			// Capitalize first letter of each word
			return color
				.split(" ")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(" ");
		}
	}

	return null;
};

/**
 * Extract model number from text
 */
const extractModel = (text) => {
	// iPhone patterns: "iPhone 15", "iPhone 17 Pro", "iPhone 16 Pro Max"
	const iphonePattern = /iPhone\s*(\d+)\s*(Pro|Max|Plus|Air)?\s*(Pro|Max)?/gi;
	const iphoneMatch = text.match(iphonePattern);
	if (iphoneMatch) {
		return iphoneMatch[0].trim();
	}

	// Samsung patterns: "Galaxy S24", "Galaxy Note 20"
	const samsungPattern = /Galaxy\s+(S|Note|A|M)\s*\d+/gi;
	const samsungMatch = text.match(samsungPattern);
	if (samsungMatch) {
		return samsungMatch[0].trim();
	}

	// OnePlus patterns: "OnePlus Nord 5", "OnePlus 12"
	const oneplusPattern = /OnePlus\s+(Nord\s*)?\d+/gi;
	const oneplusMatch = text.match(oneplusPattern);
	if (oneplusMatch) {
		return oneplusMatch[0].trim();
	}

	// Generic pattern: Brand + number
	const genericPattern = /([A-Z][a-z]+)\s+(\d+)/g;
	const genericMatch = text.match(genericPattern);
	if (genericMatch) {
		return genericMatch[0].trim();
	}

	return null;
};

/**
 * Extract brightness from text
 */
const extractBrightness = (text) => {
	const brightnessPattern = /(\d+[,.]?\d*)\s*nits/gi;
	const brightnessMatch = text.match(brightnessPattern);
	if (brightnessMatch) {
		const match = brightnessMatch[0].match(/(\d+[,.]?\d*)/);
		if (match) {
			return `${match[1].replace(",", "")}nits`;
		}
	}

	return null;
};

/**
 * Extract all metadata from product title and description
 */
const extractMetadata = (title, description) => {
	const combinedText = `${title} ${description}`;
	const metadata = {};

	const ram = extractRAM(combinedText);
	if (ram) metadata.ram = ram;

	const storage = extractStorage(combinedText);
	if (storage) metadata.storage = storage;

	const screenSize = extractScreenSize(combinedText);
	if (screenSize) metadata.screenSize = screenSize;

	const color = extractColor(combinedText);
	if (color) metadata.color = color;

	const model = extractModel(combinedText);
	if (model) metadata.model = model;

	const brightness = extractBrightness(combinedText);
	if (brightness) metadata.brightness = brightness;

	return metadata;
};

export {
	extractMetadata,
	extractRAM,
	extractStorage,
	extractScreenSize,
	extractColor,
	extractModel,
	extractBrightness,
};
