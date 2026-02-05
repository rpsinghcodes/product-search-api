import express from "express";
const router = express.Router();

import * as productController from "../controllers/ProductController.js";
import * as searchController from "../controllers/SearchController.js";
import {
	validateProduct,
	validateMetadata,
	validateSearchQuery,
	validateProductId,
} from "../middleware/validator.js";

router.post("/v1/product", validateProduct, productController.createProduct);
router.put(
	"/v1/product/meta-data",
	validateMetadata,
	productController.updateProductMetadata
);
router.get(
	"/v1/product/:productId",
	validateProductId,
	productController.getProduct
);
router.delete(
	"/v1/product/:productId",
	validateProductId,
	productController.deleteProduct
);
router.get("/v1/products", productController.listProducts);

router.get(
	"/v1/search/product",
	validateSearchQuery,
	searchController.searchProducts
);
router.get("/v1/search/suggestions", searchController.getSearchSuggestions);
router.get("/v1/search/filters", searchController.getSearchFilters);

export default router;
