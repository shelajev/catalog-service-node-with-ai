const { createAndBootstrapPostgresContainer, createAndBootstrapKafkaContainer } = require("./containerSupport");
const { Kafka, logLevel } = require("kafkajs");

describe("Product creation", () => {
  let postgresContainer, kafkaContainer, productService, publisherService;

  beforeAll(async () => {
    console.log("Starting containers");

    postgresContainer = await createAndBootstrapPostgresContainer();
    kafkaContainer = await createAndBootstrapKafkaContainer();
  }, 120000); // Making this very long in case the images need to be pulled

  beforeAll(async () => {
    productService = require("../src/services/ProductService");
    publisherService = require("../src/services/PublisherService");
  });
  
  afterAll(async () => {
    await productService.teardown();
    await publisherService.teardown();

    await postgresContainer.stop();
    await kafkaContainer.stop();
  });

  it("should publish and return a product when creating a product", async () => {
    const product = await productService.createProduct({ name: "Test Product", price: 100 });

    expect(product.id).toBeDefined();
    expect(product.name).toBe("Test Product");
    expect(product.price).toBe(100);

    const retrievedProduct = await productService.getProductById(product.id);
    expect(retrievedProduct.id).toBe(product.id);
    expect(retrievedProduct.name).toBe(product.name);
    expect(retrievedProduct.inventory).toEqual({
      error: true,
      message: "Failed to get inventory"
    });
  });

  it("should publish a Kafka message when creating a product", async () => {
    const identifier = Math.random().toString(36).substring(7);
    const brokers = (process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092").split(",");
    const kafka = new Kafka({
      clientId: 'test-client-' + identifier,
      brokers,
      logLevel: logLevel.ERROR,
    });

    const consumer = kafka.consumer({ groupId: "test-group-" + identifier });

    try {
      await consumer.connect();

      let result = { receivedMessage : false }, createdProduct;
      await consumer.subscribe({ topic: "products", fromBeginning: true });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const data = JSON.parse(message.value.toString());

          if (data.id === createdProduct.id && data.action === "product_created") {
            result.receivedMessage = true;
          }
        }
      });

      createdProduct = await productService.createProduct({ name: "Test Product", price: 100 });
  
      expect(createdProduct.id).toBeDefined();
      expect(createdProduct.name).toBe("Test Product");
      expect(createdProduct.price).toBe(100);

      await waitFor(
        () => {
          expect(result.receivedMessage).toBe(true)
        },
        5000,
      );
    } finally {
      await consumer.disconnect();
    }
  }, 15000);

});

async function waitFor(callback, timeout, interval = 250) {
  let timeWaited = 0;
  while (timeWaited < timeout) {
    try {
      callback();
      return;
    } catch (e) {}

    await new Promise((resolve) => setTimeout(resolve, interval));
    timeWaited += interval;
  }

  throw new Error("Timeout waiting for callback");
}