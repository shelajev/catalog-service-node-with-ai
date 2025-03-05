const { default: weaviate } = require("weaviate-ts-client");

async function main() {
  const client = weaviate.client({
    scheme: "http",
    host: "localhost:8088",
  });

  // Check if Weaviate is ready
  const ready = await client.misc.readyChecker().do();
  console.log("Weaviate ready:", ready);

  // First check if collection exists and delete it to start fresh
  const collections = await client.schema.getter().do();
  if (collections.classes?.some((c) => c.class === "Question")) {
    await client.schema.classDeleter().withClassName("Question").do();
  }

  // Create collection with Ollama integrations
  await client.schema
    .classCreator()
    .withClass({
      class: "Question",
      vectorizer: "text2vec-ollama",
      moduleConfig: {
        "text2vec-ollama": {
          model: "nomic-embed-text",
          apiEndpoint: "http://ollama:11434",
        },
        "generative-ollama": {
          model: "llama3.2:3b",
          apiEndpoint: "http://ollama:11434",
        },
      },
    })
    .do();

  async function getJsonData() {
    const response = await fetch(
      "https://raw.githubusercontent.com/weaviate-tutorials/quickstart/main/data/jeopardy_tiny.json",
    );
    return response.json();
  }

  // Import the questions
  async function importQuestions() {
    const data = await getJsonData();
    const batcher = client.batch.objectsBatcher();
    let counter = 0;

    for (const item of data) {
      const obj = {
        class: "Question",
        properties: item,
      };
      batcher.withObject(obj);
      counter++;
    }

    const result = await batcher.do();
    console.log(`Imported ${counter} questions`);
    return result;
  }

  await importQuestions();

  // Perform a semantic search
  const result = await client.graphql
    .get()
    .withClassName("Question")
    .withFields("question answer category")
    .withNearText({ concepts: ["biology"] })
    .withLimit(2)
    .do();

  console.log(
    "Search results:",
    JSON.stringify(result.data.Get.Question, null, 2),
  );
}

main().catch(console.error);
