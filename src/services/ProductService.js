const { Client } = require("pg");

const { getInventoryForProduct } = require("./InventoryService");
const { uploadFile, getFile } = require("./StorageService");
const { publishEvent } = require("./PublisherService");
const productGenerator = require("./ProductGenerator");
const agentService = require("./AgentService");

let client;
async function getClient() {
  if (!client) {
    // Configured using environment variables
    client = new Client();
    await client.connect();
  }
  return client;
}

async function teardown() {
  if (client) {
    await client.end();
  }
}

async function getProducts() {
  const client = await getClient();

  const result = await client.query("SELECT * FROM products ORDER BY id ASC");

  return result.rows;
}

async function createProduct(product) {
  console.time("createProduct");
  const client = await getClient();

  const existingProduct = await client.query(
    "SELECT * FROM products WHERE upc = $1",
    [product.upc],
  );

  if (existingProduct.rows.length > 0)
    throw new Error("Product with this UPC already exists");

  console.time("createProduct:dbInsert");
  const result = await client.query(
    "INSERT INTO products (name, description, category, upc, price) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [
      product.name,
      product.description,
      product.category,
      product.upc,
      product.price || null,
    ],
  );
  console.timeEnd("createProduct:dbInsert");

  const newProductId = result.rows[0].id;

  console.time("createProduct:publishEvent");
  publishEvent("products", {
    action: "product_created",
    id: newProductId,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    upc: product.upc,
  });
  console.timeEnd("createProduct:publishEvent");

  console.timeEnd("createProduct");
  return {
    ...product,
    id: newProductId,
  };
}

async function getProductById(id) {
  const client = await getClient();

  const result = await client.query("SELECT * FROM products WHERE id = $1", [
    id,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  const product = result.rows[0];

  const inventory = await getInventoryForProduct(product.upc);

  return {
    inventory,
    ...product,
  };
}

async function getProductImage(id) {
  return getFile(id);
}

async function uploadProductImage(id, buffer) {
  const client = await getClient();

  await uploadFile(id, buffer);
  await client.query("UPDATE products SET has_image=TRUE WHERE id=$1", [id]);
}

async function deleteProduct(id) {
  const client = await getClient();

  // First check if the product exists
  const checkResult = await client.query(
    "SELECT * FROM products WHERE id = $1",
    [id],
  );

  if (checkResult.rows.length === 0) {
    return false;
  }

  const product = checkResult.rows[0];

  try {
    // Start a transaction
    await client.query("BEGIN");

    // Delete any recommendations where this product is the source
    await client.query(
      "DELETE FROM saved_recommendations WHERE source_product_id = $1",
      [id],
    );

    // Delete any recommendations where this product is the recommended product
    await client.query(
      "DELETE FROM saved_recommendations WHERE recommended_product_id = $1",
      [id],
    );

    // Delete the product
    await client.query("DELETE FROM products WHERE id = $1", [id]);

    // Commit the transaction
    await client.query("COMMIT");

    // Publish an event about the deletion
    publishEvent("products", {
      action: "product_deleted",
      id: id,
      name: product.name,
      upc: product.upc,
    });

    return true;
  } catch (error) {
    // Rollback in case of error
    await client.query("ROLLBACK");
    console.error("Error in deleteProduct transaction:", error);
    throw error;
  }
}

async function generateRandomProduct() {
  console.time("generateRandomProduct");
  const product = await productGenerator.generateRandomProduct();
  console.timeEnd("generateRandomProduct");
  return product;
}

async function createProductWithAI(prompt) {
  console.time("createProductWithAI");

  // Generate product details using AI
  console.log(`Generating product from prompt: "${prompt}"`);

  // Define the product generation prompt
  const productGenerationPrompt = `You are a product catalog assistant. Your job is to generate complete product details based on a brief description.
Always respond with valid JSON in the following format:
{
  "name": "Product Name",
  "description": "Detailed product description",
  "category": "Appropriate category",
  "price": 99.99,
  "upc": "123456789012"
}

The name should be concise (3-5 words).
The description should be 1-2 sentences highlighting key features.
The category should be one of: Electronics, Clothing, Home, Kitchen, Sports, Beauty, Toys, Books, Food, Other.
The price should be a reasonable market price for such a product (between $5 and $1000).
The UPC should be a random 12-digit number.`;

  try {
    // Use the agent service to process the query
    const response = await agentService.processQuery(
      `Generate a complete product based on this description: ${prompt}`,
      null,
      productGenerationPrompt,
    );

    // Parse the JSON response
    const productDetails = JSON.parse(response);
    console.log(`Successfully generated product: "${productDetails.name}"`);

    // Create the product in the database
    const createdProduct = await createProduct(productDetails);

    console.timeEnd("createProductWithAI");
    return createdProduct;
  } catch (error) {
    console.error("Error generating product details:", error);

    // Provide a fallback product if generation fails
    const fallbackProduct = {
      name: "Generated Product",
      description: `A product based on: ${prompt}`,
      category: "Other",
      price: 99.99,
      upc: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
    };

    // Create the fallback product in the database
    const createdProduct = await createProduct(fallbackProduct);

    console.timeEnd("createProductWithAI");
    return createdProduct;
  }
}

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  getProductImage,
  uploadProductImage,
  deleteProduct,
  generateRandomProduct,
  createProductWithAI,
  teardown,
};
