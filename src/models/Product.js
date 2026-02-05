class Product {
	constructor(data) {
		this.productId = data.productId;
		this.title = data.title || "";
		this.description = data.description || "";
		this.brand = data.brand || "unknown";
		this.category = data.category || "mobile";
		this.price = data.price || 0;
		this.mrp = data.mrp || data.price || 0;
		this.sellingPrice = data.sellingPrice || data.price || 0;
		this.currency = data.currency || "Rupee";
		this.rating = data.rating || 0;
		this.stock = data.stock || 0;

		this.metadata = data.metadata || {};
		this.unitsSold = data.unitsSold || 0;
		this.returnRate = data.returnRate || 0;
		this.reviewCount = data.reviewCount || 0;
		this.complaintCount = data.complaintCount || 0;
		this.discountPercentage = data.discountPercentage || 0;
		this.isLatest = data.isLatest || false;
		this.popularityScore = data.popularityScore || 0;
		this.searchKeywords = data.searchKeywords || [];
		this.searchText = data.searchText || "";

		if (this.mrp > 0 && this.price < this.mrp) {
			this.discountPercentage = ((this.mrp - this.price) / this.mrp) * 100;
		}

		this.updateSearchText();
	}

	updateSearchText() {
		const parts = [
			this.title,
			this.description,
			this.brand,
			this.category,
			...Object.values(this.metadata).filter((v) => typeof v === "string"),
		];
		this.searchText = parts.join(" ").toLowerCase();
		this.searchKeywords = this.extractKeywords(this.searchText);
	}

	extractKeywords(text) {
		const words = text
			.replace(/[^\w\s]/g, " ")
			.split(/\s+/)
			.filter((word) => {
				return word.length > 2 || /^\d+$/.test(word);
			});

		return [...new Set(words)];
	}

	toJSON() {
		return {
			productId: this.productId,
			title: this.title,
			description: this.description,
			mrp: this.mrp,
			sellingPrice: this.sellingPrice,
			metadata: this.metadata,
			stock: this.stock,
			rating: this.rating,
			brand: this.brand,
			category: this.category,
		};
	}
}

export default Product;
