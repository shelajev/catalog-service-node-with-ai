const { Kafka, Partitioners } = require('kafkajs')

const BROKER_URLS = (process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092").split(",");

const kafka = new Kafka({
  clientId: 'catalog-service',
  brokers: BROKER_URLS
});

let producer;

async function publishEvent(topic, event) {
  if (!producer) {
    producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
    await producer.connect();
  }

  await producer.send({
    topic,
    messages: [
      { value: JSON.stringify(event) }
    ]
  });
}

module.exports = {
  publishEvent,
};
