# E-commerce Search Engine Microservice

A high-performance search engine microservice for e-commerce platforms, specifically designed for electronics targeting Tier-2 and Tier-3 cities in India. The service provides intelligent product search with advanced ranking algorithms, spelling correction, Hinglish support, and intent-based filtering.

## Features

- 🔍 **Advanced Search**: Multi-factor ranking algorithm combining relevance, quality, and popularity
- 🎯 **Query Processing**: Handles spelling mistakes, Hinglish queries, and intent extraction
- 📊 **Smart Ranking**: Considers ratings, sales, stock availability, discounts, and more
- ⚡ **High Performance**: In-memory storage with optimized indexing for sub-1000ms latency
- 💾 **Data Persistence**: Products are automatically saved to `data/amazon_products_raw.json`
- 🔢 **Number Support**: Search queries with numbers (e.g., "Phone 17 Cover") are fully supported
- 🛡️ **Robust Error Handling**: Comprehensive validation and error management
- 📝 **RESTful API**: Clean, well-documented API endpoints

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Storage**: In-memory (Map-based) for fast access
- **NLP**: Natural language processing for query understanding
- **Validation**: express-validator for request validation

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd scrapping
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)

   Create a `.env` file in the root directory:

   ```bash
   PORT=3000
   ```

   The default port is 3000 if not specified.

4. **Start the server**

   **Production mode:**

   ```bash
   npm start
   ```

   **Development mode** (with auto-reload):

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000` (or the port specified in `.env`).

   The service will automatically load products from `data/amazon_products_raw.json` on startup. You should see a message like:

   ```
   Initializing service...
   Loaded 590 products successfully. 0 errors.
   Total products in catalog: 590
   📡 Server running on http://localhost:3000
   ```

## Data Persistence

All product operations (create, update, delete) automatically persist changes to `data/amazon_products_raw.json`. This means:

- ✅ Products added via API are saved to the file
- ✅ Product updates are reflected in the file
- ✅ Deleted products are removed from the file
- ✅ Data persists across server restarts

## Quick Start

1. **Check if server is running:**

   ```bash
   curl http://localhost:3000/health
   ```

2. **Search for products:**

   ```bash
   curl "http://localhost:3000/api/v1/search/product?query=iPhone"
   ```

3. **Get all products:**
   ```bash
   curl http://localhost:3000/api/v1/products
   ```

## API Routes Summary

| Method | Endpoint                     | Description                   |
| ------ | ---------------------------- | ----------------------------- |
| GET    | `/health`                    | Health check endpoint         |
| POST   | `/api/v1/product`            | Create a new product          |
| PUT    | `/api/v1/product/meta-data`  | Update product metadata       |
| GET    | `/api/v1/product/:productId` | Get product by ID             |
| DELETE | `/api/v1/product/:productId` | Delete a product              |
| GET    | `/api/v1/products`           | List all products (paginated) |
| GET    | `/api/v1/search/product`     | Search products               |
| GET    | `/api/v1/search/suggestions` | Get search suggestions        |
| GET    | `/api/v1/search/filters`     | Get available filters         |

## API Documentation

### Base URL

```
http://localhost:3000
```

### Health Check

**GET** `/health`

Check if the server is running.

**Response:**

```json
{
	"success": true,
	"message": "Service is running",
	"timestamp": "2026-02-05T10:30:00.000Z"
}
```

**Example:**

```bash
curl http://localhost:3000/health
```

---

### API Endpoints

All API endpoints are prefixed with `/api`

### Product Endpoints

#### 1. Create Product

**POST** `/api/v1/product`

Create a new product in the catalog. The product will be automatically persisted to `data/amazon_products_raw.json`.

**Request Body:**

```json
{
	"title": "iPhone 17",
	"description": "6.3-inch 120Hz ProMotion OLED display with 3,000 nits peak brightness, powered by the A19 chip. It includes a new 18MP front camera with Center Stage, 48MP dual rear cameras, 8GB of RAM, and a 3692mAh battery",
	"rating": 4.2,
	"stock": 1000,
	"price": 81999,
	"mrp": 82999,
	"currency": "Rupee"
}
```

**Required Fields:**

- `title` (string): Product title
- `price` (number): Product price

**Optional Fields:**

- `description` (string): Product description (default: "")
- `rating` (number): Product rating 0-5 (default: 0)
- `stock` (number): Available stock (default: 0)
- `mrp` (number): Maximum retail price (default: same as price)
- `currency` (string): Currency code (default: "Rupee")

**Response:**

```json
{
	"success": true,
	"productId": 101
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 17",
    "description": "Latest iPhone model",
    "rating": 4.5,
    "stock": 100,
    "price": 81999,
    "mrp": 82999,
    "currency": "Rupee"
  }'
```

**Status Codes:**

- `201`: Product created successfully
- `400`: Validation error

#### 2. Update Product Metadata

**PUT** `/api/v1/product/meta-data`

Update metadata for an existing product. Changes are persisted to `data/amazon_products_raw.json`.

**Request Body:**

```json
{
	"productId": 101,
	"metadata": {
		"ram": "8GB",
		"screenSize": "6.3 inches",
		"model": "iPhone 17",
		"storage": "128GB",
		"brightness": "3000nits",
		"color": "Blue"
	}
}
```

**Required Fields:**

- `productId` (number): Product ID to update
- `metadata` (object): Metadata object with key-value pairs

**Response:**

```json
{
	"success": true,
	"productId": 101,
	"metadata": {
		"ram": "8GB",
		"screenSize": "6.3 inches",
		"model": "iPhone 17",
		"storage": "128GB",
		"brightness": "3000nits",
		"color": "Blue"
	}
}
```

**Example:**

```bash
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 101,
    "metadata": {
      "ram": "8GB",
      "storage": "256GB",
      "color": "Red"
    }
  }'
```

**Status Codes:**

- `200`: Metadata updated successfully
- `400`: Validation error
- `404`: Product not found

#### 3. Get Product by ID

**GET** `/api/v1/product/:productId`

Retrieve a specific product by its ID.

**URL Parameters:**

- `productId` (number): Product ID

**Response:**

```json
{
	"success": true,
	"data": {
		"productId": 101,
		"title": "iPhone 17",
		"description": "6.3-inch 120Hz ProMotion OLED display...",
		"mrp": 82999,
		"sellingPrice": 81999,
		"metadata": {
			"ram": "8GB",
			"storage": "128GB"
		},
		"stock": 1000,
		"rating": 4.2,
		"brand": "Apple",
		"category": "mobile"
	}
}
```

**Example:**

```bash
curl http://localhost:3000/api/v1/product/101
```

**Status Codes:**

- `200`: Product found
- `404`: Product not found
- `400`: Invalid product ID format

#### 4. Delete Product

**DELETE** `/api/v1/product/:productId`

Delete a product from the catalog. Changes are persisted to `data/amazon_products_raw.json`.

**URL Parameters:**

- `productId` (number): Product ID to delete

**Response:**

```json
{
	"success": true,
	"message": "Product 101 deleted successfully"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3000/api/v1/product/101
```

**Status Codes:**

- `200`: Product deleted successfully
- `404`: Product not found
- `400`: Invalid product ID format

#### 5. List All Products

**GET** `/api/v1/products`

Get paginated list of all products.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "productId": 101,
      "title": "iPhone 17",
      "description": "...",
      "mrp": 82999,
      "sellingPrice": 81999,
      "metadata": {...},
      "stock": 1000,
      "rating": 4.2,
      "brand": "Apple",
      "category": "mobile"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 590,
    "totalPages": 12
  }
}
```

**Example:**

```bash
# Get first page
curl http://localhost:3000/api/v1/products

# Get page 2 with 20 items per page
curl "http://localhost:3000/api/v1/products?page=2&limit=20"
```

**Status Codes:**

- `200`: Success

---

### Search Endpoints

#### 6. Search Products

**GET** `/api/v1/search/product`

Search for products with intelligent ranking, spelling correction, and intent-based filtering.

**Query Parameters:**

- `query` (required): Search query string
- `limit` (optional): Maximum number of results (default: 50, max: 100)

**Example Requests:**

```bash
# Basic search
curl "http://localhost:3000/api/v1/search/product?query=iPhone"

# Search with limit
curl "http://localhost:3000/api/v1/search/product?query=iPhone&limit=10"

# Search with spelling mistakes (auto-corrected)
curl "http://localhost:3000/api/v1/search/product?query=Ifone"

# Search with Hinglish
curl "http://localhost:3000/api/v1/search/product?query=Sastha wala iPhone"

# Search with model number
curl "http://localhost:3000/api/v1/search/product?query=Phone 17 Cover"

# Search with filters
curl "http://localhost:3000/api/v1/search/product?query=iPhone 16 red color"

# Search with price range
curl "http://localhost:3000/api/v1/search/product?query=iPhone 50k rupees"
```

**Response:**

```json
{
	"success": true,
	"data": [
		{
			"productId": 80,
			"title": "iPhone 13",
			"description": "This is an iPhone 13 64GB white colour",
			"mrp": 62999,
			"sellingPrice": 35000,
			"metadata": {
				"storage": "64GB",
				"color": "White"
			},
			"stock": 10,
			"rating": 4.5,
			"brand": "Apple",
			"category": "mobile"
		}
	],
	"count": 1
}
```

**Features:**

- ✅ Handles spelling mistakes (e.g., "Ifone" → "iPhone")
- ✅ Supports Hinglish queries (e.g., "Sastha wala" → "cheap")
- ✅ Extracts intent (price, color, model, etc.)
- ✅ Numbers in queries are preserved (e.g., "Phone 17 Cover")
- ✅ Direct text matching for exact phrases
- ✅ Fuzzy matching for similar words

**Status Codes:**

- `200`: Search successful
- `400`: Query parameter missing or invalid

#### 7. Get Search Suggestions

**GET** `/api/v1/search/suggestions`

Get autocomplete suggestions for search queries.

**Query Parameters:**

- `query` (required): Partial search query (minimum 2 characters)
- `limit` (optional): Maximum number of suggestions (default: 10)

**Response:**

```json
{
	"success": true,
	"data": ["iphone 17", "iphone 16", "iphone 15"]
}
```

**Example:**

```bash
curl "http://localhost:3000/api/v1/search/suggestions?query=iph"
```

**Status Codes:**

- `200`: Success (returns empty array if query is too short)

#### 8. Get Search Filters

**GET** `/api/v1/search/filters`

Get available filters (brands, categories, price ranges) for search.

**Response:**

```json
{
	"success": true,
	"data": {
		"brands": ["Apple", "Samsung", "OnePlus"],
		"categories": ["mobile", "laptop"],
		"priceRange": {
			"min": 1000,
			"max": 200000
		}
	}
}
```

**Example:**

```bash
curl http://localhost:3000/api/v1/search/filters
```

**Status Codes:**

- `200`: Success

## Ranking Algorithm

The search engine uses a sophisticated multi-factor ranking algorithm:

### Score Components

1. **Relevance Score (50% weight)**

   - Keyword match in title: 40%
   - Keyword match in description: 20%
   - Keyword match in metadata: 20%
   - Exact match bonus: +20%
   - Brand/model/color match bonuses

2. **Quality Score (30% weight)**

   - Rating (normalized to 0-5): 30%
   - Review count: 20%
   - Return rate (inverse): 20%
   - Complaint count (inverse): 10%
   - Stock availability: 20%

3. **Popularity Score (20% weight)**
   - Units sold: 40%
   - Discount percentage: 30%
   - Latest model flag: 30%

### Special Handling

- **Price-based queries**: Products within the specified price range get boosted
- **"Latest" queries**: Newer models receive higher scores
- **Stock availability**: In-stock items are prioritized
- **Exact matches**: Exact brand/model matches get bonus points
- **Spelling mistakes**: Fuzzy matching handles common typos
- **Hinglish support**: Translates Hindi-English mixed queries

### Final Score Calculation

```
finalScore = (relevanceScore × 0.5) + (qualityScore × 0.3) + (popularityScore × 0.2) + specialBoosts
```

## Query Processing Features

### 1. Spelling Correction

- Automatically corrects common mistakes: "Ifone" → "iPhone", "Sastha" → "Sasta"
- Uses Levenshtein distance for fuzzy matching

### 2. Hinglish Support

- Translates Hindi-English mixed queries
- Examples: "Sasta wala iPhone" → "cheap iPhone"

### 3. Intent Extraction

- **Price intent**: "iPhone 50k rupees" → filters by max price
- **Color intent**: "iPhone red color" → filters by color
- **Model intent**: "iPhone 16" → filters by model
- **Sort intent**: "Latest iPhone" → sorts by recency

### 4. Query Normalization

- Converts to lowercase
- Removes special characters
- Tokenizes and processes keywords

## Example Queries

| Query                 | Expected Behavior                                |
| --------------------- | ------------------------------------------------ |
| `Latest iphone`       | Returns newest iPhone models first               |
| `Sastha wala iPhone`  | Handles Hinglish, returns cheaper iPhones        |
| `Ifone 16`            | Corrects spelling, finds iPhone 16               |
| `iPhone 16 red color` | Filters by model and color                       |
| `iPhone 50k rupees`   | Filters by price range (≤50,000)                 |
| `iPhone cover strong` | Finds iPhone accessories with "strong" attribute |

## Data Model

### Product Structure

```javascript
{
  productId: number,
  title: string,
  description: string,
  brand: string,
  category: string,
  price: number,
  mrp: number,
  sellingPrice: number,
  currency: string,
  rating: number (0-5),
  stock: number,
  metadata: {
    ram: string,
    storage: string,
    screenSize: string,
    model: string,
    color: string,
    brightness: string,
    // ... other dynamic attributes
  },
  // Ranking factors (synthetic)
  unitsSold: number,
  returnRate: number (0-1),
  reviewCount: number,
  complaintCount: number,
  discountPercentage: number,
  isLatest: boolean,
  popularityScore: number
}
```

## Performance

- **Latency**: < 1000ms for search queries
- **Storage**: In-memory Map-based storage for O(1) lookups
- **Indexing**: Pre-computed indexes for categories, brands, and keywords
- **Scalability**: Optimized for millions of products

## Error Handling

All APIs return consistent error responses:

```json
{
	"success": false,
	"error": {
		"message": "Error description",
		"details": [] // For validation errors
	}
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Project Structure

```
scrapping/
├── src/
│   ├── models/
│   │   └── Product.js          # Product entity/model
│   ├── services/
│   │   ├── ProductService.js   # Product CRUD operations
│   │   ├── SearchService.js     # Search logic
│   │   ├── QueryProcessor.js    # Query processing
│   │   └── RankingEngine.js    # Ranking algorithm
│   ├── controllers/
│   │   ├── ProductController.js
│   │   └── SearchController.js
│   ├── middleware/
│   │   ├── errorHandler.js      # Error handling
│   │   └── validator.js         # Request validation
│   ├── utils/
│   │   ├── dataLoader.js        # Data loading
│   │   ├── metadataExtractor.js # Metadata extraction
│   │   └── constants.js         # Constants
│   ├── routes/
│   │   └── api.js               # API routes
│   └── server.js                # Express app
├── data/
│   └── amazon_products_raw.json # Product data
├── package.json
└── README.md
```

## Testing the API

### Using cURL

**1. Check server health:**

```bash
curl http://localhost:3000/health
```

**2. Search for products:**

```bash
# Basic search
curl "http://localhost:3000/api/v1/search/product?query=iPhone"

# Search with model number
curl "http://localhost:3000/api/v1/search/product?query=Phone 17 Cover"
```

**3. Create a product:**

```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product",
    "description": "Test description",
    "price": 10000,
    "rating": 4.5,
    "stock": 100
  }'
```

**4. Get product by ID:**

```bash
curl http://localhost:3000/api/v1/product/101
```

**5. Update product metadata:**

```bash
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 101,
    "metadata": {
      "color": "Blue",
      "storage": "256GB"
    }
  }'
```

**6. List all products:**

```bash
curl "http://localhost:3000/api/v1/products?page=1&limit=10"
```

**7. Delete a product:**

```bash
curl -X DELETE http://localhost:3000/api/v1/product/101
```

**8. Get search suggestions:**

```bash
curl "http://localhost:3000/api/v1/search/suggestions?query=iph"
```

**9. Get search filters:**

```bash
curl http://localhost:3000/api/v1/search/filters
```

### Using Postman

1. Import the API endpoints into Postman
2. Set base URL: `http://localhost:3000`
3. Test endpoints using the examples provided above
4. Make sure to set `Content-Type: application/json` header for POST/PUT requests

### Using Browser

You can test GET endpoints directly in your browser:

- Health check: `http://localhost:3000/health`
- Search: `http://localhost:3000/api/v1/search/product?query=iPhone`
- Get product: `http://localhost:3000/api/v1/product/101`
- List products: `http://localhost:3000/api/v1/products`

## Future Enhancements

- [ ] LLM-based metadata enrichment
- [ ] Search analytics and logging
- [ ] Query caching for frequently searched terms
- [ ] Faceted search (advanced filtering)
- [ ] Database persistence option
- [ ] Search result personalization
- [ ] Multi-language support

## License

ISC

## Author

Built as part of an e-commerce search engine implementation exercise.
