const agentService = require("./AgentService");
const ProductService = require("./ProductService");

class ProductRecommender {
  constructor() {
    this.systemPrompt = `You are a product recommendation expert. 
Your job is to recommend products that work great with or are frequently bought together with a given product.
Always respond with valid JSON in the format:
{
  "name": "Product Name",
  "description": "Product description that explains why this product works well with the original product",
  "price": 99.99,
  "category": "Category Name"
}`;
  }

  /**
   * Generate a recommendation for a product that works well with the given product
   * @param {Object} product - The original product to generate a recommendation for
   * @returns {Promise<Object>} - A recommended product
   */
  async generateRecommendation(product) {
    if (!product) {
      throw new Error("Product is required to generate a recommendation");
    }

    const query = `Recommend a product that works great with or is frequently bought together with this product.
Make sure your recommendation is realistic and complementary to the original product.`;

    try {
      const response = await agentService.processQuery(
        query,
        product,
        this.systemPrompt,
      );

      // Parse the JSON response
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

      return recommendation;
    } catch (error) {
      console.error("Error generating recommendation:", error);

      // Fallback to a simple recommendation if LLM fails
      return this.createFallbackRecommendation(product);
    }
  }

  /**
   * Create a fallback recommendation if the LLM fails
   * @param {Object} product - The original product
   * @returns {Object} - A simple recommendation
   */
  createFallbackRecommendation(product) {
    return {
      id: product.id + 1000,
      name: `Companion for ${product.name}`,
      description: `This product works great with ${product.name}`,
      category: product.category,
      price: product.price * 0.8,
      upc: this.generateRandomUPC(),
    };
  }

  /**
   * Generate a random UPC (12 digits)
   * @returns {string} A random UPC
   */
  generateRandomUPC() {
    return (Math.floor(Math.random() * 900000000000) + 100000000000).toString();
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
