import productService from "../services/ProductService.js";
import { extractMetadata } from "../utils/metadataExtractor.js";

const createProduct = async (req, res, next) => {
	try {
		const {
			title,
			description = "",
			rating = 0,
			stock = 0,
			price,
			mrp = price,
			currency = "Rupee",
		} = req.body;

		const metadata = extractMetadata(title, description);

		const productData = {
			title,
			description,
			rating,
			stock,
			price,
			mrp,
			sellingPrice: price,
			currency,
			metadata,
		};

		const product = productService.addProduct(productData);

		res.status(201).json({
			success: true,
			productId: product.productId,
		});
	} catch (error) {
		next(error);
	}
};

const updateProductMetadata = async (req, res, next) => {
	try {
		const { productId, metadata } = req.body;

		const product = productService.getProduct(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				error: {
					message: `Product with ID ${productId} not found`,
				},
			});
		}

		const updatedProduct = productService.updateProductMetadata(
			productId,
			metadata
		);

		res.json({
			success: true,
			productId: updatedProduct.productId,
			metadata: updatedProduct.metadata,
		});
	} catch (error) {
		next(error);
	}
};

const getProduct = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const productIdNum = parseInt(productId);

		const product = productService.getProduct(productIdNum);
		if (!product) {
			return res.status(404).json({
				success: false,
				error: {
					message: `Product with ID ${productId} not found`,
				},
			});
		}

		res.json({
			success: true,
			data: product.toJSON(),
		});
	} catch (error) {
		next(error);
	}
};

const deleteProduct = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const productIdNum = parseInt(productId);

		const deleted = productService.deleteProduct(productIdNum);
		if (!deleted) {
			return res.status(404).json({
				success: false,
				error: {
					message: `Product with ID ${productId} not found`,
				},
			});
		}

		res.json({
			success: true,
			message: `Product ${productId} deleted successfully`,
		});
	} catch (error) {
		next(error);
	}
};

const listProducts = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;

		const result = productService.getAllProducts(page, limit);

		res.json({
			success: true,
			data: result.products.map((p) => p.toJSON()),
			pagination: {
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: result.totalPages,
			},
		});
	} catch (error) {
		next(error);
	}
};

export {
	createProduct,
	updateProductMetadata,
	getProduct,
	deleteProduct,
	listProducts,
};
