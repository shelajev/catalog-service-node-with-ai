require("dotenv").config();
const os = require("os");
const fs = require("fs");
const express = require("express");
const ProductService = require("./services/ProductService");
const PublisherService = require("./services/PublisherService");
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
  try {
    // Validate required fields
    const { name, upc, price } = req.body;
    if (!name || !upc || !price) {
      return res.status(400).json({
        error: "Missing required fields: name, upc, and price are required",
      });
    }

    const newProduct = await ProductService.createProduct(req.body);

    res
      .status(201)
      .header("Location", `/api/products/${newProduct.id}`)
      .json(newProduct);
  } catch (error) {
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
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const recommendation =
      await RecommendationService.getRecommendationForProduct(productId);
    res.json(recommendation);
  } catch (error) {
    console.error("Error getting recommendation:", error);
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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await ProductService.teardown();
    await PublisherService.teardown();
    process.exit(0);
  });
});
