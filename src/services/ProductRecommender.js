const agentService = require("./AgentService");
const ProductService = require("./ProductService");

class ProductRecommender {
  constructor() {
    this.systemPrompt = `You are a product recommendation expert. 
Your job is to recommend products that work great with or are frequently bought together with a given product.
You must ensure that your recommended product has a unique name that doesn't match any existing product in the catalog.
Always respond with valid JSON in the format:

{
  "name": "Product Name",
  "description": "Product description that explains why this product works well with the original product",
  "category": "Category Name"
}`;
  }

  /**
   * Generate a recommendation for a product that works well with the given product
   * @param {Object} product - The original product to generate a recommendation for
   * @returns {Promise<Object>} - A recommended product
   */
  async generateRecommendation(product) {
    console.log(
      `Starting to generate recommendation for product: "${product.name}" (ID: ${product.id})`,
    );
    console.time(`ProductRecommender:generateRecommendation:${product.id}`);
    if (!product) {
      throw new Error("Product is required to generate a recommendation");
    }

    // Get all products from the catalog to avoid duplicates
    console.log(`Fetching all products from catalog to avoid duplicates`);
    console.time(`ProductRecommender:getProducts:${product.id}`);
    const allProducts = await ProductService.getProducts();
    console.timeEnd(`ProductRecommender:getProducts:${product.id}`);

    // Extract product names for the prompt
    const existingProductNames = allProducts.map((p) => p.name);

    const query = `Recommend a product that works great with or is frequently bought together with this product.
Make sure your recommendation is realistic and complementary to the original product.
IMPORTANT: Your recommendation MUST have a unique name that is not in the following list of existing product names:
${existingProductNames.join(", ")}`;

    try {
      console.log(
        `Requesting AI to generate recommendation for product: "${product.name}"`,
      );
      console.time(`ProductRecommender:agentService:${product.id}`);
      const response = await agentService.processQuery(
        query,
        product,
        this.systemPrompt,
      );
      console.timeEnd(`ProductRecommender:agentService:${product.id}`);
      console.log(`AI recommendation received, processing response...`);

      // Parse the JSON response
      console.time(`ProductRecommender:parseResponse:${product.id}`);
      const recommendation = JSON.parse(response);

      // Add additional fields
      recommendation.id = product.id + 1000; // Just to make it different
      recommendation.upc = this.generateRandomUPC();

      // Ensure price is a number
      if (typeof recommendation.price === "string") {
        recommendation.price = parseFloat(
          recommendation.price.replace(/[^0-9.]/g, ""),
        );
      }

      // If price is still not a valid number, generate a random one
      if (isNaN(recommendation.price)) {
        recommendation.price = Math.floor(Math.random() * 995) + 5;
      }
      console.timeEnd(`ProductRecommender:parseResponse:${product.id}`);
      console.log(
        `Successfully generated recommendation: "${recommendation.name}"`,
      );

      console.timeEnd(
        `ProductRecommender:generateRecommendation:${product.id}`,
      );
      return recommendation;
    } catch (error) {
      console.error("Error generating recommendation:", error);

      // Fallback to a simple recommendation if LLM fails
      console.log(
        `Using fallback recommendation for product: "${product.name}"`,
      );
      console.timeEnd(
        `ProductRecommender:generateRecommendation:${product.id}`,
      );
      return this.createFallbackRecommendation(product);
    }
  }

  /**
   * Create a fallback recommendation if the LLM fails
   * @param {Object} product - The original product
   * @returns {Object} - A simple recommendation
   */
  createFallbackRecommendation(product) {
    // Add timestamp to ensure name uniqueness
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");
    return {
      id: product.id + 1000,
      name: `Companion for ${product.name} (${timestamp})`,
      description: `This product works great with ${product.name}`,
      category: product.category,
      price: product.price * 0.8,
      upc: this.generateRandomUPC(),
    };
  }

  /**
   * Generate a random UPC (12 digits) with timestamp to ensure uniqueness
   * @returns {string} A random UPC
   */
  generateRandomUPC() {
    // Use timestamp as part of the UPC to ensure uniqueness
    const timestamp = Date.now().toString().slice(-10);
    const randomPart = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    return timestamp.slice(0, 7) + randomPart;
  }

  /**
   * Update the system prompt used for recommendations
   * @param {string} newSystemPrompt - The new system prompt
   */
  updateSystemPrompt(newSystemPrompt) {
    if (newSystemPrompt && typeof newSystemPrompt === "string") {
      this.systemPrompt = newSystemPrompt;
    }
  }
}

module.exports = new ProductRecommender();
