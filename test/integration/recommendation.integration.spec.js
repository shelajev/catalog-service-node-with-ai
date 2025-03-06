const { createAndBootstrapPostgresContainer } = require("./containerSupport");
const { createAndBootstrapOllamaContainer } = require("./ollamaSupport");
const ProductService = require("../../src/services/ProductService");
const RecommendationService = require("../../src/services/RecommendationService");

describe("Recommendation Integration Tests", () => {
  let postgresContainer;
  let ollamaContainer;

  beforeAll(async () => {
    // Start the containers
    postgresContainer = await createAndBootstrapPostgresContainer();
    ollamaContainer = await createAndBootstrapOllamaContainer();
  }, 120000); // Increase timeout for container startup and model download

  afterAll(async () => {
    // Stop the containers
    await postgresContainer.stop();
    await ollamaContainer.stop();
    await ProductService.teardown();
  });

  beforeEach(async () => {
    // Clear the database before each test
    const client = new require("pg").Client();
    await client.connect();
    await client.query("DELETE FROM products");
    await client.end();
  });

  test("should generate a recommendation for a product with description", async () => {
    // Create test products with descriptions
    const product1 = await ProductService.createProduct({
      name: "Smartphone X",
      upc: "123456789012",
      price: 999.99,
      description:
        "A high-end smartphone with advanced camera features and long battery life.",
    });

    const product2 = await ProductService.createProduct({
      name: "Smartphone Case",
      upc: "223456789012",
      price: 29.99,
      description:
        "A protective case designed for smartphones, with shock absorption technology.",
    });

    const product3 = await ProductService.createProduct({
      name: "Laptop Pro",
      upc: "323456789012",
      price: 1499.99,
      description:
        "A powerful laptop for professionals, with high performance and sleek design.",
    });

    // Get recommendation for product1
    const recommendation =
      await RecommendationService.getRecommendationForProduct(product1.id);

    // Verify the recommendation structure
    expect(recommendation).toBeDefined();
    expect(recommendation.sourceProductId).toBe(product1.id);
    expect(recommendation.recommendedProduct).toBeDefined();

    // The recommended product should be one of the other products
    const recommendedId = recommendation.recommendedProduct.id;
    expect([product2.id, product3.id]).toContain(recommendedId);
  }, 30000); // Increase timeout for AI processing

  test("should handle multiple product recommendations", async () => {
    // Create test products with descriptions
    const product1 = await ProductService.createProduct({
      name: "Coffee Maker",
      upc: "423456789012",
      price: 89.99,
      description:
        "An automatic coffee maker that brews delicious coffee with precision.",
    });

    const product2 = await ProductService.createProduct({
      name: "Coffee Beans",
      upc: "523456789012",
      price: 15.99,
      description: "Premium coffee beans, freshly roasted for maximum flavor.",
    });

    const product3 = await ProductService.createProduct({
      name: "Tea Kettle",
      upc: "623456789012",
      price: 45.99,
      description:
        "A stainless steel kettle for boiling water for tea or other hot beverages.",
    });

    // Get recommendations for multiple products
    const recommendations =
      await RecommendationService.getRecommendationsForProducts([
        product1.id,
        product3.id,
      ]);

    // Verify the recommendations
    expect(recommendations).toHaveLength(2);

    // Check first recommendation
    expect(recommendations[0].sourceProductId).toBe(product1.id);
    expect(recommendations[0].recommendedProduct).toBeDefined();

    // Check second recommendation
    expect(recommendations[1].sourceProductId).toBe(product3.id);
    expect(recommendations[1].recommendedProduct).toBeDefined();
  }, 60000); // Increase timeout for multiple AI processing

  test("should handle errors for products without descriptions", async () => {
    // Create a product without a description
    const product = await ProductService.createProduct({
      name: "Product without description",
      upc: "723456789012",
      price: 19.99,
    });

    // Attempt to get a recommendation should throw an error
    await expect(
      RecommendationService.getRecommendationForProduct(product.id),
    ).rejects.toThrow(/has no description/);
  });

  test("should handle errors for non-existent products", async () => {
    // Attempt to get a recommendation for a non-existent product
    await expect(
      RecommendationService.getRecommendationForProduct(999),
    ).rejects.toThrow(/not found/);
  });
});
