# Catalog Service - Node

This repo is a demo project that demonstrates all of Docker's services in a single project. Specifically, it includes the following:

- A containerized development environment (in a few varieties of setup)
- Integration testing with Testcontainers
- Building in GitHub Actions with Docker Build Cloud

## Trying it out

This project is currently configured to run all dependent services in containers and the app natively on the machine (using Node installed on the machine).

To start the app, follow these steps:

1. Ensure you have [Node 22+](https://nodejs.org) installed on your machine.

2. Start all of the application dependencies

   ```console
   docker compose -f compose/compose.yaml up 
   ```
   And separately start Ollama. Note Ollama container requests GPU access, so you should run it against the environment that allows that. 
   ```console
   docker compose -f compose/ollama.yaml up 
   ```
   

3. Install the app dependencies and start the main app with the following command:

   ```console
   npm install --omit=optional
   npm run dev
   ```

4. Once everything is up and running, you can open the demo client at [http://localhost:5173](http://localhost:5173).

### Debugging the application

The project contains configuration for VS Code to enable quick debgging. Once the app is running, you can start a debug session by using the **Debug** task in the "Run and Debug" panel. This currently only works when the app is running natively on the machine.

### Running tests

This project contains a few unit tests and integration tests to demonstrate Testcontainer usage. To run them, follow these steps (assuming you're using VS Code):

1. Download and install the [Jest extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest#user-interface).

2. Open the "Testing" tab in the left-hand navigation (looks like a flask).

3. Press play for the test you'd like to run.

The \*.integration.spec.js tests will use Testcontainers to launch Kafka, Postgres, LocalStack, and Ollama. 

#### Running tests via the command line

Or you can run the tests using the command line:

```console
# Run all tests
$ npm test

# Run only unit tests
$ npm run unit-test

# Run only the integration tests
$ npm run integration-test
```

## Additional utilities

Once the development environment is up and running, the following URLs can be leveraged:

- [http://localhost:5173](http://localhost:5173) - a simple React app that provides the ability to interact with the API via a web interface (helpful during demos)
- [http://localhost:5050](http://localhost:5050) - [pgAdmin](https://www.pgadmin.org/) to visualize the database. Login using the password `postgres` (configured in the Compose file)
- [http://localhost:8080](http://localhost:8080) - [kafbat](https://github.com/kafbat/kafka-ui) to visualize the Kafka cluster
