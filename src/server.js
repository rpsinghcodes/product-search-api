import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import apiRoutes from "./routes/api.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { loadProducts } from "./utils/dataLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
	next();
});

app.get("/health", (req, res) => {
	res.json({
		success: true,
		message: "Service is running",
		timestamp: new Date().toISOString(),
	});
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

console.log("Initializing service...");
try {
	const dataPath = join(__dirname, "../data/amazon_products_raw.json");
	const result = loadProducts(dataPath);
	console.log(`Service initialized with ${result.loaded} products`);
} catch (error) {
	console.error("Error loading products:", error.message);
	console.log(
		"Service will start without pre-loaded products. You can add products via API."
	);
}

app.listen(PORT, () => {
	console.log(`📡 Server running on http://localhost:${PORT}`);
});

export default app;
