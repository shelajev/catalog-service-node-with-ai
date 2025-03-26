const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");

class AgentService {
  constructor() {
    const openAiApiUrl =
      process.env.OPENAI_API_URL ||
      "http://localhost:12434/engines/llama.cpp/v1";
    const openAiApiKey = process.env.OPENAI_API_KEY || "not-needed";
    const openAiModel = process.env.OPENAI_MODEL || "ai/llama3.2:1B-Q4_0";

    this.model = new ChatOpenAI({
      openAIApiKey: openAiApiKey,
      configuration: {
        baseURL: openAiApiUrl,
      },
      modelName: openAiModel,
      temperature: 0.7,
    });
  }

  /**
   * Create a prompt chain with system prompt and user input
   * @param {string} systemPrompt - The system prompt to use
   * @returns {RunnableSequence} - The prompt chain
   */
  createPromptChain() {
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
   * Process a query with a system prompt
   * @param {string} query - The user's query
   * @param {Object} product - Optional product object to include in context
   * @param {string} systemPrompt - The system prompt to use
   * @returns {Promise<string>} - The agent's response
   */
  async processQuery(query, product = null, systemPrompt) {
    if (!systemPrompt) {
      throw new Error("System prompt is required");
    }

    console.log(
      `Starting AI processing for query: "${query.substring(0, 50)}${query.length > 50 ? "..." : ""}"`,
    );
    console.time("AgentService:processQuery");
    try {
      // Create the chain
      const chain = this.createPromptChain();

      // Prepare the input
      let finalQuery = query || "Tell me about this product";

      // If product is provided, include it in the query
      if (product) {
        console.log(`Processing query with product ID: ${product.id}`);
        finalQuery = `${finalQuery}\n\nProduct Information:\n${JSON.stringify(product, null, 2)}`;
      }

      // Invoke the chain
      console.log(`Sending request to AI model...`);
      console.time("AgentService:modelInvoke");
      const response = await chain.invoke({
        system: systemPrompt,
        query: finalQuery,
      });
      console.timeEnd("AgentService:modelInvoke");
      console.log(`AI model response received`);

      console.timeEnd("AgentService:processQuery");
      return response;
    } catch (error) {
      console.error("Error processing query with agent:", error);
      console.timeEnd("AgentService:processQuery");
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }
}

module.exports = new AgentService();
