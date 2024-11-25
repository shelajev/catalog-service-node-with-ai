const {PostgreSqlContainer} = require("@testcontainers/postgresql");
const {KafkaContainer} = require("@testcontainers/kafka");
const {LocalstackContainer} = require("@testcontainers/localstack");
const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");

async function createAndBootstrapPostgresContainer() {
  const postgresContainer = await new PostgreSqlContainer()
    .withBindMounts([
      {
        source: path.join(__dirname, "../dev/db"),
        target: "/docker-entrypoint-initdb.d",
        readOnly: false,
      },
    ])
    .start();

  // Configure the pg library
  process.env.PGUSER = postgresContainer.getUsername();
  process.env.PGPASSWORD = postgresContainer.getPassword();
  process.env.PGHOST = postgresContainer.getHost();
  process.env.PGPORT = postgresContainer.getPort();
  process.env.PGDATABASE = postgresContainer.getDatabase();

  return postgresContainer;
}


async function createAndBootstrapKafkaContainer() {
  const kafkaContainer = await new KafkaContainer()
    .withKraft()
    .withExposedPorts(9093)
    .start();

  process.env.KAFKA_BOOTSTRAP_SERVERS = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;

  await kafkaContainer.exec("kafka-topics --create --topic products --partitions 1 --replication-factor 1 --bootstrap-server localhost:9092");

  return kafkaContainer;
}

async function createAndBootstrapLocalstackContainer() {
  const localstackContainer = await new LocalstackContainer()
    .start();

  process.env.AWS_ENDPOINT_URL = localstackContainer.getConnectionUri();
  process.env.PRODUCT_IMAGE_BUCKET_NAME = "product-images";

  await localstackContainer.exec(`s3api create-bucket --bucket ${process.env.PRODUCT_IMAGE_BUCKET_NAME}`);

  return localstackContainer;
}


module.exports = {
  createAndBootstrapPostgresContainer,
  createAndBootstrapKafkaContainer,
  createAndBootstrapLocalstackContainer,
};