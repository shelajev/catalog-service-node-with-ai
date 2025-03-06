const ProductService = require("./ProductService");
const ProductRecommender = require("./ProductRecommender");

class RecommendationService {
  /**
   * Get a recommendation for a specific product
   * @param {number} productId - The ID of the product to get a recommendation for
   * @returns {Promise<Object>} - A recommended product
   */
  async getRecommendationForProduct(productId) {
    // Get the original product
    const originalProduct = await ProductService.getProductById(productId);

    if (!originalProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Use the ProductRecommender to generate a recommendation
    const recommendation =
      await ProductRecommender.generateRecommendation(originalProduct);

    return recommendation;
  }

  /**
   * Get recommendations for multiple products
   * @param {number[]} productIds - Array of product IDs
   * @returns {Promise<Object[]>} - Array of recommended products
   */
  async getRecommendationsForProducts(productIds) {
    const recommendations = [];

    for (const productId of productIds) {
      try {
        const recommendation =
          await this.getRecommendationForProduct(productId);
        recommendations.push(recommendation);
      } catch (error) {
        console.warn(
          `Could not get recommendation for product ${productId}: ${error.message}`,
        );
        // Continue with other products even if one fails
      }
    }

    return recommendations;
  }
}

module.exports = new RecommendationService();
