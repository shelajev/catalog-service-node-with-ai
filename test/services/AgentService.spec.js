const AgentService = require("../../src/services/AgentService");

describe("AgentService", () => {
  // This is a basic structure test - not actually calling Ollama
  test("should have required methods", () => {
    expect(AgentService).toBeDefined();
    expect(typeof AgentService.processQuery).toBe("function");
  });
});
