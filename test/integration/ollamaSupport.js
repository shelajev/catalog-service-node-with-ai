const { GenericContainer } = require("testcontainers");

async function createAndBootstrapOllamaContainer() {
  const ollamaContainer = await new GenericContainer("ollama/ollama:latest")
    .withExposedPorts(11434)
    .withEnvironment({
      OLLAMA_HOST: "0.0.0.0",
    })
    .start();

  // Set environment variables for the Ollama API
  process.env.OLLAMA_API_URL = `http://${ollamaContainer.getHost()}:${ollamaContainer.getMappedPort(11434)}`;
  process.env.OLLAMA_MODEL = "llama3.2:3b";

  // Pull the model
  const pullModelCommand = await ollamaContainer.exec(
    `ollama pull ${process.env.OLLAMA_MODEL}`,
  );

  // Check if the model was pulled successfully
  if (pullModelCommand.exitCode !== 0) {
    console.error("Failed to pull Ollama model:", pullModelCommand.output);
    throw new Error("Failed to pull Ollama model");
  }

  return ollamaContainer;
}

module.exports = {
  createAndBootstrapOllamaContainer,
};
