const AgentService = require("../../src/services/AgentService");

describe("AgentService", () => {
  // This is a basic structure test - not actually calling Ollama
  test("should have required methods", () => {
    expect(AgentService).toBeDefined();
    expect(typeof AgentService.processQuery).toBe("function");
    expect(typeof AgentService.updateDefaultSystemPrompt).toBe("function");
  });

  // Example of how to test with a mock
  test("should update system prompt", () => {
    const originalPrompt = AgentService.defaultSystemPrompt;
    const newPrompt = "You are a product recommendation specialist.";

    AgentService.updateDefaultSystemPrompt(newPrompt);
    expect(AgentService.defaultSystemPrompt).toBe(newPrompt);

    // Reset for other tests
    AgentService.updateDefaultSystemPrompt(originalPrompt);
  });

  // Note: The following test is commented out because it would actually call Ollama
  // Uncomment and run manually when Ollama is available
  /*
  test("should process a query", async () => {
    const mockProduct = {
      id: 1,
      name: "Test Product",
      description: "A test product for testing",
      price: 99.99
    };
    
    const response = await AgentService.processQuery(
      "What can you tell me about this product?", 
      mockProduct
    );
    
    expect(response).toBeDefined();
    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
  }, 10000); // Longer timeout for LLM call
  */
});
