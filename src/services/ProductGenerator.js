const agentService = require("./AgentService");

class ProductGenerator {
  constructor() {
    // Define product categories
    this.categories = [
      "Star Wars Sith artifacts",
      "Diablo III weapons",
      "Star Trek cosmic technology",
      "Pokemon clothing",
      "My little pony merchandise",
    ];

    // Define prompts for easy editing
    this.userPromptTemplate = `Generate a creative, humorous, and realistic product name and description for a product in the {category} category.
      Output a JSON object with three fields: "name", "description", and "category". 
      The "name" should be 3-5 words. 
      The "description" should be 1-2 witty, engaging sentences that clearly relate to the {category} theme.

      Product name should be short and catchy, and demonstrate knowledge of pop-culture references in the {category}.
      `;

    this.systemPrompt = `You are a product catalog assistant with a playful tone. 
      Your role is to craft creative, humorous, and realistic product names and descriptions. 
      Always ensure the response is relevant to the specified category and strictly follows the JSON format.

      Not to generate items with a name like "{category} Item"
      and descriptions like "A quality product in the {category} category."
      Be creative and those items aren't real anyhow.
      
      Ensure the output is valid JSON in this format:

      {
        "name": "Product Name",
        "description": "A humorous yet realistic description that ties into {category}.",
        "category": "Category Name"
      }

      Do not include any other text or characters in your response. Do not start your response with \`\`\`json or \`\`\`! No markdown characters should be visible in the output.
      `;
  }

  /**
   * Get a random category from the predefined list
   * @returns {string} A random category
   */
  getRandomCategory() {
    return this.categories[Math.floor(Math.random() * this.categories.length)];
  }

  /**
   * Generate a random price between $5 and $1000
   * @returns {number} A random price
   */
  generateRandomPrice() {
    return Math.floor(Math.random() * 995) + 5;
  }

  /**
   * Generate a random UPC (12 digits)
   * @returns {string} A random UPC
   */
  generateRandomUPC() {
    return (Math.floor(Math.random() * 900000000000) + 100000000000).toString();
  }

  /**
   * Generate a user prompt for a specific category
   * @param {string} category - The product category
   * @returns {string} The formatted user prompt
   */
  formatUserPrompt(category) {
    return this.userPromptTemplate.replace("{category}", category);
  }

  /**
   * Generate a complete random product
   * @returns {Promise<Object>} A product object with name, description, price, and UPC
   */
  async generateRandomProduct() {
    const randomCategory = this.getRandomCategory();
    console.log(
      `Starting to generate a new random product in category: ${randomCategory}...`,
    );
    console.time("ProductGenerator:generateRandomProduct");
    const randomPrice = this.generateRandomPrice();
    const randomUPC = this.generateRandomUPC();

    // Format the user prompt with the random category
    const userPrompt = this.formatUserPrompt(randomCategory);

    // Use the agent service to generate product details
    console.log(
      `Requesting AI to generate product details for category: ${randomCategory}...`,
    );
    console.time("ProductGenerator:agentService");
    const response = (
      await agentService.processQuery(userPrompt, null, this.systemPrompt)
    )
      .replace("```json", "")
      .replace("```", "");
    console.timeEnd("ProductGenerator:agentService");

    try {
      // Parse the response to get name and description
      console.log(`Response: "${response}"`);
      const productDetails = JSON.parse(response);

      const result = {
        name: productDetails.name,
        description: productDetails.description,
        category: randomCategory,
        price: randomPrice,
        upc: randomUPC,
      };
      console.log(
        `Successfully generated new product: "${productDetails.name}"`,
      );
      console.timeEnd("ProductGenerator:generateRandomProduct");
      return result;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      // Fallback in case parsing fails
      const fallback = {
        name: `${randomCategory} Item`,
        description: `A quality product in the ${randomCategory} category.`,
        category: randomCategory,
        price: randomPrice,
        upc: randomUPC,
      };
      console.log(
        `Using fallback product generation for category: ${randomCategory}`,
      );
      console.timeEnd("ProductGenerator:generateRandomProduct");
      return fallback;
    }
  }

  /**
   * Update the system prompt
   * @param {string} newSystemPrompt - The new system prompt
   */
  updateSystemPrompt(newSystemPrompt) {
    if (newSystemPrompt && typeof newSystemPrompt === "string") {
      this.systemPrompt = newSystemPrompt;
    }
  }

  /**
   * Update the user prompt template
   * @param {string} newUserPromptTemplate - The new user prompt template
   */
  updateUserPromptTemplate(newUserPromptTemplate) {
    if (newUserPromptTemplate && typeof newUserPromptTemplate === "string") {
      this.userPromptTemplate = newUserPromptTemplate;
    }
  }

  /**
   * Update the categories list
   * @param {Array<string>} newCategories - The new categories list
   */
  updateCategories(newCategories) {
    if (Array.isArray(newCategories) && newCategories.length > 0) {
      this.categories = newCategories;
    }
  }
}

module.exports = new ProductGenerator();
