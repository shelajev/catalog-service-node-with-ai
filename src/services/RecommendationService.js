const ProductService = require("./ProductService");
const ProductRecommender = require("./ProductRecommender");
const { Client } = require("pg");

// Local database connection
let client;
async function getClient() {
  if (!client) {
    // Configured using environment variables
    client = new Client();
    await client.connect();
  }
  return client;
}

class RecommendationService {
  /**
   * Get a recommendation for a specific product
   * @param {number} productId - The ID of the product to get a recommendation for
   * @returns {Promise<Object>} - A recommended product
   */
  async getRecommendationForProduct(productId) {
    console.time(
      `RecommendationService:getRecommendationForProduct:${productId}`,
    );
    // Get the original product
    console.time(`RecommendationService:getProductById:${productId}`);
    const originalProduct = await ProductService.getProductById(productId);
    console.timeEnd(`RecommendationService:getProductById:${productId}`);

    if (!originalProduct) {
      console.timeEnd(
        `RecommendationService:getRecommendationForProduct:${productId}`,
      );
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Use the ProductRecommender to generate a recommendation
    console.time(`RecommendationService:generateRecommendation:${productId}`);
    const recommendedProduct =
      await ProductRecommender.generateRecommendation(originalProduct);
    console.timeEnd(
      `RecommendationService:generateRecommendation:${productId}`,
    );

    // Return the recommendation with the expected structure
    console.timeEnd(
      `RecommendationService:getRecommendationForProduct:${productId}`,
    );
    return {
      sourceProductId: productId,
      recommendedProduct,
    };
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

  /**
   * Save a recommendation to the database
   * @param {number} sourceProductId - The ID of the source product
   * @param {number} recommendedProductId - The ID of the recommended product
   * @returns {Promise<Object>} - The saved recommendation
   */
  async saveRecommendation(sourceProductId, recommendedProductId) {
    const client = await getClient();

    try {
      // Check if both products exist
      const sourceProduct =
        await ProductService.getProductById(sourceProductId);
      const recommendedProduct =
        await ProductService.getProductById(recommendedProductId);

      if (!sourceProduct) {
        throw new Error(`Source product with ID ${sourceProductId} not found`);
      }

      if (!recommendedProduct) {
        throw new Error(
          `Recommended product with ID ${recommendedProductId} not found`,
        );
      }

      // Insert the recommendation
      const result = await client.query(
        `INSERT INTO saved_recommendations 
         (source_product_id, recommended_product_id) 
         VALUES ($1, $2) 
         ON CONFLICT (source_product_id, recommended_product_id) DO NOTHING
         RETURNING id, source_product_id, recommended_product_id, created_at`,
        [sourceProductId, recommendedProductId],
      );

      // If there was a conflict, get the existing record
      if (result.rows.length === 0) {
        const existingResult = await client.query(
          `SELECT id, source_product_id, recommended_product_id, created_at 
           FROM saved_recommendations 
           WHERE source_product_id = $1 AND recommended_product_id = $2`,
          [sourceProductId, recommendedProductId],
        );

        return {
          ...existingResult.rows[0],
          sourceProduct,
          recommendedProduct,
        };
      }

      return {
        ...result.rows[0],
        sourceProduct,
        recommendedProduct,
      };
    } catch (error) {
      console.error("Error saving recommendation:", error);
      throw error;
    }
  }

  /**
   * Get all saved recommendations
   * @returns {Promise<Object[]>} - Array of saved recommendations
   */
  async getSavedRecommendations() {
    const client = await getClient();

    const result = await client.query(
      `SELECT sr.id, sr.source_product_id, sr.recommended_product_id, sr.created_at,
              sp.name as source_product_name, rp.name as recommended_product_name
       FROM saved_recommendations sr
       JOIN products sp ON sr.source_product_id = sp.id
       JOIN products rp ON sr.recommended_product_id = rp.id
       ORDER BY sr.created_at DESC`,
    );

    return result.rows;
  }

  /**
   * Close database connections
   */
  async teardown() {
    if (client) {
      await client.end();
      client = null;
    }
  }

  /**
   * Save a recommended product and create the recommendation relationship
   * @param {number} sourceProductId - The ID of the source product
   * @param {Object} recommendedProduct - The recommended product to save
   * @returns {Promise<Object>} - The saved recommendation
   */
  async saveRecommendedProduct(sourceProductId, recommendedProduct) {
    console.time(
      `RecommendationService:saveRecommendedProduct:${sourceProductId}`,
    );
    try {
      // First, check if the source product exists
      console.time(`RecommendationService:getSourceProduct:${sourceProductId}`);
      const sourceProduct =
        await ProductService.getProductById(sourceProductId);
      console.timeEnd(
        `RecommendationService:getSourceProduct:${sourceProductId}`,
      );

      if (!sourceProduct) {
        console.timeEnd(
          `RecommendationService:saveRecommendedProduct:${sourceProductId}`,
        );
        throw new Error(`Source product with ID ${sourceProductId} not found`);
      }

      // Create a copy of the recommended product to avoid modifying the original
      const productToSave = { ...recommendedProduct };

      // Always generate a new UPC to avoid conflicts
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-10);
      const randomPart = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");
      productToSave.upc = timestamp + randomPart;

      // If it doesn't have a category, use the source product's category
      if (!productToSave.category) {
        productToSave.category = sourceProduct.category;
      }

      // Save the product
      console.time(`RecommendationService:createProduct:${sourceProductId}`);
      const savedProduct = await ProductService.createProduct(productToSave);
      console.timeEnd(`RecommendationService:createProduct:${sourceProductId}`);

      // Now create the recommendation relationship
      console.time(
        `RecommendationService:saveRecommendation:${sourceProductId}`,
      );
      const result = await this.saveRecommendation(
        sourceProductId,
        savedProduct.id,
      );
      console.timeEnd(
        `RecommendationService:saveRecommendation:${sourceProductId}`,
      );

      console.timeEnd(
        `RecommendationService:saveRecommendedProduct:${sourceProductId}`,
      );
      return result;
    } catch (error) {
      console.error("Error saving recommended product:", error);
      console.timeEnd(
        `RecommendationService:saveRecommendedProduct:${sourceProductId}`,
      );
      throw error;
    }
  }
}

module.exports = new RecommendationService();
