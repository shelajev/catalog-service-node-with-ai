const { createAndBootstrapPostgresContainer } = require("./containerSupport");
const { createAndBootstrapKafkaContainer } = require("./containerSupport");

describe("AI Generation Quality", () => {
  let postgresContainer, ollamaContainer, kafkaContainer;
  let productService, recommendationService;
  const TEST_ITEMS_COUNT = 6;

  beforeAll(async () => {
    await Promise.all([
      createAndBootstrapPostgresContainer().then(
        (c) => (postgresContainer = c),
      ),
      createAndBootstrapKafkaContainer().then((c) => (kafkaContainer = c)),
    ]);

    productService = require("../../src/services/ProductService");
    recommendationService = require("../../src/services/RecommendationService");
  }, 180000);

  afterAll(async () => {
    await productService.teardown();
    if (recommendationService.teardown) await recommendationService.teardown();

    await Promise.all([
      postgresContainer.stop(),
      // kafkaContainer.stop(),
    ]);
  }, 30000);

  it("should generate 5 products without fallback format", async () => {
    const products = await Promise.all(
      Array(TEST_ITEMS_COUNT)
        .fill()
        .map(() => productService.generateRandomProduct()),
    );

    for (const product of products) {
      expect(product.name).toBeDefined();
      expect(product.description).toBeDefined();

      // Check not using fallback format
      expect(product.name).not.toEqual(`${product.category} Item`);
      expect(product.description).not.toEqual(
        `A quality product in the ${product.category} category.`,
      );
    }
  }, 60000);

  it("should generate 5 recommendations without fallback format", async () => {
    // Create a product first using one of the generated products
    const generatedProduct = await productService.generateRandomProduct();
    const sourceProduct = await productService.createProduct(generatedProduct);

    const recommendations = await Promise.all(
      Array(TEST_ITEMS_COUNT)
        .fill()
        .map(() =>
          recommendationService.getRecommendationForProduct(sourceProduct.id),
        ),
    );

    for (const { recommendedProduct } of recommendations) {
      expect(recommendedProduct.name).toBeDefined();
      expect(recommendedProduct.description).toBeDefined();

      // Check not using fallback format
      expect(recommendedProduct.name).not.toMatch(/^Companion for/);
      expect(recommendedProduct.description).not.toMatch(
        /^This product works great with/,
      );
    }
  }, 60000);
});
