const { OllamaContainer } = require("@testcontainers/ollama");

async function createAndBootstrapOllamaContainer() {
  // Create and start the Ollama container
  const ollamaContainer = await new OllamaContainer().withReuse(true).start();

  // Set environment variables for the Ollama API
  process.env.OLLAMA_API_URL = ollamaContainer.getEndpoint();
  process.env.OLLAMA_MODEL = "gemma2:9b";

  console.log(`Ollama container started at ${process.env.OLLAMA_API_URL}`);
  console.log(`Using model: ${process.env.OLLAMA_MODEL}`);

  // Pull the model
  console.log(`Pulling Ollama model: ${process.env.OLLAMA_MODEL}`);
  const pullModelCommand = await ollamaContainer.exec([
    "ollama",
    "pull",
    process.env.OLLAMA_MODEL,
  ]);

  // Check if the model was pulled successfully
  if (pullModelCommand.exitCode !== 0) {
    console.error("Failed to pull Ollama model:", pullModelCommand.output);
    throw new Error("Failed to pull Ollama model");
  }

  console.log("Ollama model pulled successfully");
  return ollamaContainer;
}

module.exports = {
  createAndBootstrapOllamaContainer,
};
