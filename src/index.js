require("dotenv").config();
const os = require("os");
const fs = require("fs");
const express = require("express");
const ProductService = require("./services/ProductService");
const PublisherService = require("./services/PublisherService");
const RecommendationService = require("./services/RecommendationService");
const multer = require("multer");

const app = express();
app.use(express.json());
const upload = multer({ dest: os.tmpdir() });

app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

app.get("/api/products", async (req, res) => {
  const products = await ProductService.getProducts();
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  console.time("API:createProduct");
  try {
    // Generate a random product instead of requiring details from the frontend
    console.time("API:generateRandomProduct");
    const randomProduct = await ProductService.generateRandomProduct();
    console.timeEnd("API:generateRandomProduct");

    // Create the product in the database
    console.time("API:saveProduct");
    const newProduct = await ProductService.createProduct(randomProduct);
    console.timeEnd("API:saveProduct");

    console.timeEnd("API:createProduct");
    res
      .status(201)
      .header("Location", `/api/products/${newProduct.id}`)
      .json(newProduct);
  } catch (error) {
    console.timeEnd("API:createProduct");
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);

  if (!product) {
    res.status(404).send();
    return;
  }

  res.json(product);
});

app.get("/api/products/:id/image", async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);

  if (!product) {
    res.status(404).send();
    return;
  }

  const imageStream = await ProductService.getProductImage(req.params.id);

  if (!imageStream) {
    res.status(404).send();
    return;
  }

  res.contentType("image/png");
  imageStream.pipe(res);
});

app.post("/api/products/:id/image", upload.single("file"), async (req, res) => {
  const product = await ProductService.uploadProductImage(
    req.params.id,
    fs.readFileSync(req.file.path),
  );

  res.json(product);
});

app.get("/api/products/:id/recommendations", async (req, res) => {
  console.time(`API:getRecommendation:${req.params.id}`);
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      console.timeEnd(`API:getRecommendation:${req.params.id}`);
      return res.status(400).json({ error: "Invalid product ID" });
    }

    console.time(`API:getRecommendationForProduct:${productId}`);
    const recommendation =
      await RecommendationService.getRecommendationForProduct(productId);
    console.timeEnd(`API:getRecommendationForProduct:${productId}`);

    console.timeEnd(`API:getRecommendation:${req.params.id}`);
    res.json(recommendation);
  } catch (error) {
    console.error("Error getting recommendation:", error);
    console.timeEnd(`API:getRecommendation:${req.params.id}`);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ error: error.message });
  }
});

app.get("/api/recommendations", async (req, res) => {
  try {
    const { productIds } = req.query;

    if (!productIds) {
      return res
        .status(400)
        .json({ error: "Missing productIds query parameter" });
    }

    // Parse the comma-separated list of product IDs
    const ids = productIds
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return res.status(400).json({ error: "No valid product IDs provided" });
    }

    const recommendations =
      await RecommendationService.getRecommendationsForProducts(ids);
    res.json(recommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to save a recommendation
app.post("/api/recommendations", async (req, res) => {
  try {
    const { sourceProductId, recommendedProductId } = req.body;

    if (!sourceProductId || !recommendedProductId) {
      return res.status(400).json({
        error: "Both sourceProductId and recommendedProductId are required",
      });
    }

    // Parse IDs to integers, handling both string and number inputs
    const sourceId = parseInt(sourceProductId, 10);
    const recommendedId = parseInt(recommendedProductId, 10);

    if (isNaN(sourceId) || isNaN(recommendedId)) {
      return res.status(400).json({
        error: "Invalid product IDs",
      });
    }

    const savedRecommendation = await RecommendationService.saveRecommendation(
      sourceId,
      recommendedId,
    );

    res.status(201).json(savedRecommendation);
  } catch (error) {
    console.error("Error saving recommendation:", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ error: error.message });
  }
});

// Endpoint to get all saved recommendations
app.get("/api/saved-recommendations", async (req, res) => {
  try {
    const savedRecommendations =
      await RecommendationService.getSavedRecommendations();
    res.json(savedRecommendations);
  } catch (error) {
    console.error("Error getting saved recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to save a recommended product
app.post("/api/recommended-products", async (req, res) => {
  console.time("API:saveRecommendedProduct");
  try {
    const { sourceProductId, recommendedProduct } = req.body;

    if (!sourceProductId || !recommendedProduct) {
      console.timeEnd("API:saveRecommendedProduct");
      return res.status(400).json({
        error: "Both sourceProductId and recommendedProduct are required",
      });
    }

    // Validate the recommended product has required fields
    if (!recommendedProduct.name || !recommendedProduct.description) {
      console.timeEnd("API:saveRecommendedProduct");
      return res.status(400).json({
        error: "Recommended product must have at least a name and description",
      });
    }

    // Parse source ID to integer
    const sourceId = parseInt(sourceProductId, 10);

    if (isNaN(sourceId)) {
      console.timeEnd("API:saveRecommendedProduct");
      return res.status(400).json({
        error: "Invalid source product ID",
      });
    }

    console.time("API:saveRecommendedProductService");
    const savedRecommendation =
      await RecommendationService.saveRecommendedProduct(
        sourceId,
        recommendedProduct,
      );
    console.timeEnd("API:saveRecommendedProductService");

    console.timeEnd("API:saveRecommendedProduct");
    res.status(201).json(savedRecommendation);
  } catch (error) {
    console.error("Error saving recommended product:", error);
    console.timeEnd("API:saveRecommendedProduct");

    // Provide more detailed error messages
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (error.message.includes("already exists")) {
      statusCode = 409;
      errorMessage = "This product already exists in the database";
    }

    res.status(statusCode).json({ error: errorMessage });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await ProductService.teardown();
    await PublisherService.teardown();
    await RecommendationService.teardown();
    process.exit(0);
  });
});
