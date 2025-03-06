const { Ollama } = require("@langchain/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");

class AgentService {
  constructor() {
    // Initialize the Ollama model with llama3.2:3b
    this.model = new Ollama({
      baseUrl: "http://localhost:11434", // Ollama API endpoint
      model: "llama3.2:3b", // Model name
      temperature: 0.7, // Controls randomness (0 = deterministic, 1 = creative)
    });

    // Default system prompt template
    this.defaultSystemPrompt = `You are a helpful AI assistant that provides information about products.
Your goal is to help users understand product features and benefits.
Be concise, accurate, and helpful in your responses.`;
  }

  /**
   * Create a prompt chain with system prompt and user input
   * @param {string} systemPrompt - The system prompt to use (or default if not provided)
   * @returns {RunnableSequence} - The prompt chain
   */
  createPromptChain(systemPrompt = this.defaultSystemPrompt) {
    // Create a prompt template that combines system prompt and user input
    const promptTemplate = PromptTemplate.fromTemplate(`
System: {system}

User: {query}
`);

    // Create a chain: promptTemplate -> model -> outputParser
    return RunnableSequence.from([
      promptTemplate,
      this.model,
      new StringOutputParser(),
    ]);
  }

  /**
   * Process a query about a product
   * @param {string} query - The user's query
   * @param {Object} product - Optional product object to include in context
   * @param {string} systemPrompt - Optional custom system prompt
   * @returns {Promise<string>} - The agent's response
   */
  async processQuery(query, product = null, systemPrompt = null) {
    try {
      // Use default system prompt if none provided
      const finalSystemPrompt = systemPrompt || this.defaultSystemPrompt;

      // Create the chain
      const chain = this.createPromptChain(finalSystemPrompt);

      // Prepare the input
      let finalQuery = query || "Tell me about this product";

      // If product is provided, include it in the query
      if (product) {
        finalQuery = `${finalQuery}\n\nProduct Information:\n${JSON.stringify(product, null, 2)}`;
      }

      // Invoke the chain
      const response = await chain.invoke({
        system: finalSystemPrompt,
        query: finalQuery,
      });

      return response;
    } catch (error) {
      console.error("Error processing query with agent:", error);
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  /**
   * Update the default system prompt
   * @param {string} newSystemPrompt - The new system prompt to use
   */
  updateDefaultSystemPrompt(newSystemPrompt) {
    if (newSystemPrompt && typeof newSystemPrompt === "string") {
      this.defaultSystemPrompt = newSystemPrompt;
    }
  }
}

module.exports = new AgentService();
