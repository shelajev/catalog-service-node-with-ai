const fetch = require("node-fetch");
const ProductService = require("./ProductService");

// Get the Ollama API URL from environment variables or use a default
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

/**
 * Generate a recommendation for a product based on its description
 * @param {number} productId - The ID of the product to generate recommendations for
 * @returns {Promise<Object>} - A promise that resolves to the recommended product
 */
async function getRecommendationForProduct(productId) {
  try {
    // Get the product details
    const product = await ProductService.getProductById(productId);

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    if (!product.description) {
      throw new Error(`Product with ID ${productId} has no description`);
    }

    // Get all products to find recommendations from
    const allProducts = await ProductService.getProducts();

    // Filter out the current product
    const otherProducts = allProducts.filter((p) => p.id !== product.id);

    if (otherProducts.length === 0) {
      throw new Error("No other products available for recommendations");
    }

    // Create a prompt for the AI model
    const prompt = createRecommendationPrompt(product, otherProducts);

    // Call the Ollama API
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Parse the recommendation from the AI response
    const recommendedProductId = parseRecommendationResponse(
      data.response,
      otherProducts,
    );

    // Get the full details of the recommended product
    const recommendedProduct =
      await ProductService.getProductById(recommendedProductId);

    return {
      sourceProductId: product.id,
      recommendedProduct: recommendedProduct,
    };
  } catch (error) {
    console.error("Error generating recommendation:", error);
    throw error;
  }
}

/**
 * Create a prompt for the AI model to generate a recommendation
 * @param {Object} product - The product to generate recommendations for
 * @param {Array<Object>} otherProducts - Other products to choose from
 * @returns {string} - The prompt for the AI model
 */
function createRecommendationPrompt(product, otherProducts) {
  const productDescriptions = otherProducts
    .map(
      (p) =>
        `Product ID: ${p.id}, Name: ${p.name}, Description: ${p.description || "No description available"}`,
    )
    .join("\n");

  return `You are a product recommendation system. Based on the following product:
  
Product ID: ${product.id}
Name: ${product.name}
Description: ${product.description}

Please recommend ONE product from the following list that would be most relevant to someone interested in the above product:

${productDescriptions}

Analyze the descriptions and recommend the most relevant product. 
Your response should be ONLY the Product ID of the recommended product, nothing else.`;
}

/**
 * Parse the AI response to extract the recommended product ID
 * @param {string} response - The AI response
 * @param {Array<Object>} otherProducts - Other products to choose from
 * @returns {number} - The ID of the recommended product
 */
function parseRecommendationResponse(response, otherProducts) {
  // Clean up the response and extract the product ID
  const cleanResponse = response.trim();

  // Try to extract a number from the response
  const match = cleanResponse.match(/\d+/);

  if (match) {
    const recommendedId = parseInt(match[0], 10);

    // Verify that the ID exists in the other products
    if (otherProducts.some((p) => p.id === recommendedId)) {
      return recommendedId;
    }
  }

  // If we couldn't extract a valid ID, return a random product as fallback
  console.warn(
    "Could not parse a valid product ID from AI response, using random recommendation",
  );
  const randomIndex = Math.floor(Math.random() * otherProducts.length);
  return otherProducts[randomIndex].id;
}

/**
 * Get recommendations for multiple products
 * @param {Array<number>} productIds - Array of product IDs to get recommendations for
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of recommendations
 */
async function getRecommendationsForProducts(productIds) {
  const recommendations = [];

  for (const productId of productIds) {
    try {
      const recommendation = await getRecommendationForProduct(productId);
      recommendations.push(recommendation);
    } catch (error) {
      console.error(
        `Error getting recommendation for product ${productId}:`,
        error,
      );
      // Continue with other products even if one fails
    }
  }

  return recommendations;
}

module.exports = {
  getRecommendationForProduct,
  getRecommendationsForProducts,
};
