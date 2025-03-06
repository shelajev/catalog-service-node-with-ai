const fs = require("fs");
const {
  createAndBootstrapPostgresContainer,
  createAndBootstrapKafkaContainer,
  createAndBootstrapLocalstackContainer,
} = require("./containerSupport");
const { createAndBootstrapOllamaContainer } = require("./ollamaSupport");
const { KafkaConsumer } = require("./kafkaSupport");

describe("Product creation", () => {
  let postgresContainer, kafkaContainer, localstackContainer, ollamaContainer;
  let kafkaConsumer;
  let productService, publisherService, agentService;

  beforeAll(async () => {
    console.log("Starting containers");

    await Promise.all([
      createAndBootstrapPostgresContainer().then(
        (c) => (postgresContainer = c),
      ),
      createAndBootstrapKafkaContainer().then((c) => (kafkaContainer = c)),
      createAndBootstrapLocalstackContainer().then(
        (c) => (localstackContainer = c),
      ),
      createAndBootstrapOllamaContainer().then((c) => (ollamaContainer = c)),
    ]);

    kafkaConsumer = await new KafkaConsumer();
  }, 180000); // Making this very long in case the images need to be pulled

  beforeAll(async () => {
    productService = require("../../src/services/ProductService");
    publisherService = require("../../src/services/PublisherService");
    agentService = require("../../src/services/AgentService");
  });

  afterAll(async () => {
    await kafkaConsumer.disconnect();
  });

  afterAll(async () => {
    await productService.teardown();
    await publisherService.teardown();
    if (agentService.teardown) await agentService.teardown();

    await Promise.all([
      postgresContainer.stop(),
      kafkaContainer.stop(),
      localstackContainer.stop(),
      ollamaContainer.stop(),
    ]);
  });

  it("should publish and return a product when creating a product", async () => {
    const product = await productService.createProduct({
      name: "Test Product",
      description: "A test product",
      category: "Test",
      price: 100,
      upc: "100000000001",
    });

    expect(product.id).toBeDefined();
    expect(product.name).toBe("Test Product");
    expect(product.category).toBe("Test");
    expect(product.price).toBe(100);

    const retrievedProduct = await productService.getProductById(product.id);
    expect(retrievedProduct.id).toBe(product.id);
    expect(retrievedProduct.name).toBe(product.name);
    expect(retrievedProduct.category).toBe("Test");
    expect(retrievedProduct.inventory).toEqual({
      error: true,
      message: "Failed to get inventory",
    });
  });

  it("should publish a Kafka message when creating a product", async () => {
    createdProduct = await productService.createProduct({
      name: "Kafka publishing test",
      description: "A test for Kafka publishing",
      category: "Test",
      price: 100,
      upc: "100000000002",
    });

    expect(createdProduct.id).toBeDefined();
    expect(createdProduct.name).toBe("Kafka publishing test");
    expect(createdProduct.category).toBe("Test");
    expect(createdProduct.price).toBe(100);
    expect(createdProduct.upc).toBe("100000000002");

    await kafkaConsumer.waitForMessage({
      id: createdProduct.id,
      action: "product_created",
    });
  }, 15000);

  it("should upload a file correctly", async () => {
    createdProduct = await productService.createProduct({
      name: "Kafka publishing test",
      description: "A test for file upload",
      category: "Test",
      price: 100,
      upc: "100000000004",
    });

    const imageBuffer = fs.readFileSync("dev/scripts/product-image.png");

    await productService.uploadProductImage(createdProduct.id, imageBuffer);

    await kafkaConsumer.waitForMessage({
      action: "image_uploaded",
      product_id: createdProduct.id,
      filename: "product.png",
    });

    const retrievedImageStream = await productService.getProductImage(
      createdProduct.id,
    );

    const retrievedImageBuffer = await (() =>
      new Promise((acc) => {
        var bufs = [];
        retrievedImageStream.on("data", function (d) {
          bufs.push(d);
        });
        retrievedImageStream.on("end", function () {
          acc(Buffer.concat(bufs));
        });
      }))();

    expect(retrievedImageBuffer).toEqual(imageBuffer);
  }, 15000);

  it("doesn't allow duplicate UPCs", async () => {
    await productService.createProduct({
      name: "Kafka publishing test",
      description: "A test for duplicate UPCs",
      category: "Test",
      price: 100,
      upc: "100000000003",
    });

    await expect(
      productService.createProduct({
        name: "Kafka publishing test",
        description: "Another test for duplicate UPCs",
        category: "Test",
        price: 100,
        upc: "100000000003",
      }),
    ).rejects.toThrow("Product with this UPC already exists");
  });

  it("should create a product with AI-generated content", async () => {
    const productPrompt = "Create a modern coffee maker with smart features";

    const aiGeneratedProduct =
      await productService.createProductWithAI(productPrompt);

    expect(aiGeneratedProduct.id).toBeDefined();
    expect(aiGeneratedProduct.name).toBeDefined();
    expect(aiGeneratedProduct.description).toBeDefined();
    expect(aiGeneratedProduct.category).toBeDefined();
    expect(aiGeneratedProduct.price).toBeDefined();
    expect(aiGeneratedProduct.upc).toBeDefined();

    // Verify the product was saved to the database
    const retrievedProduct = await productService.getProductById(
      aiGeneratedProduct.id,
    );
    expect(retrievedProduct.id).toBe(aiGeneratedProduct.id);

    // Verify a Kafka message was published
    await kafkaConsumer.waitForMessage({
      id: aiGeneratedProduct.id,
      action: "product_created",
    });
  }, 30000);
});
