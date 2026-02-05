/**
 * Request Validation Middleware
 * Validates request data using express-validator
 */

import { body, param, query, validationResult } from "express-validator";

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			error: {
				message: "Validation failed",
				details: errors.array(),
			},
		});
	}
	next();
};

/**
 * Validation rules for product creation
 */
const validateProduct = [
	body("title")
		.notEmpty()
		.withMessage("Title is required")
		.isString()
		.withMessage("Title must be a string")
		.isLength({ min: 3, max: 500 })
		.withMessage("Title must be between 3 and 500 characters"),

	body("description")
		.optional()
		.isString()
		.withMessage("Description must be a string"),

	body("rating")
		.optional()
		.isFloat({ min: 0, max: 5 })
		.withMessage("Rating must be between 0 and 5"),

	body("stock")
		.optional()
		.isInt({ min: 0 })
		.withMessage("Stock must be a non-negative integer"),

	body("price")
		.notEmpty()
		.withMessage("Price is required")
		.isFloat({ min: 0 })
		.withMessage("Price must be a positive number"),

	body("mrp")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("MRP must be a positive number"),

	body("currency")
		.optional()
		.isString()
		.withMessage("Currency must be a string"),

	handleValidationErrors,
];

/**
 * Validation rules for metadata update
 */
const validateMetadata = [
	body("productId")
		.notEmpty()
		.withMessage("Product ID is required")
		.isInt({ min: 1 })
		.withMessage("Product ID must be a positive integer"),

	body("metadata")
		.notEmpty()
		.withMessage("Metadata is required")
		.isObject()
		.withMessage("Metadata must be an object"),

	handleValidationErrors,
];

/**
 * Validation rules for search query
 */
const validateSearchQuery = [
	query("query")
		.notEmpty()
		.withMessage("Query parameter is required")
		.isString()
		.withMessage("Query must be a string")
		.isLength({ min: 1, max: 200 })
		.withMessage("Query must be between 1 and 200 characters"),

	query("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),

	handleValidationErrors,
];

/**
 * Validation rules for product ID parameter
 */
const validateProductId = [
	param("productId")
		.notEmpty()
		.withMessage("Product ID is required")
		.isInt({ min: 1 })
		.withMessage("Product ID must be a positive integer"),

	handleValidationErrors,
];

export {
	validateProduct,
	validateMetadata,
	validateSearchQuery,
	validateProductId,
	handleValidationErrors,
};
