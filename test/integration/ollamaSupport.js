const { GenericContainer } = require("testcontainers");

async function createAndBootstrapOllamaContainer() {
  const ollamaContainer = await new GenericContainer("ollama/ollama:latest")
    .withExposedPorts(11434)
    .withEnvironment({
      OLLAMA_HOST: "0.0.0.0",
    })
    .withEntrypoint([
      "sh",
      "-c",
      "ollama serve & echo 'Waiting for Ollama service to start...' && sleep 10 && echo 'Ollama service started, keeping container running...' && tail -f /dev/null",
    ])
    .start();

  // Set environment variables for the Ollama API
  process.env.OLLAMA_API_URL = `http://${ollamaContainer.getHost()}:${ollamaContainer.getMappedPort(11434)}`;
  process.env.OLLAMA_MODEL = "llama3.2:3b";

  // Wait for the Ollama service to be ready
  console.log("Waiting for Ollama service to be fully ready...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Pull the model
  console.log(`Pulling Ollama model: ${process.env.OLLAMA_MODEL}`);
  const pullModelCommand = await ollamaContainer.exec(
    `ollama pull ${process.env.OLLAMA_MODEL}`,
  );

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
