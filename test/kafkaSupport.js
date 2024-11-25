const { Kafka, logLevel } = require("kafkajs");

class KafkaConsumer {
  constructor() {
    return (async () => {
      const identifier = Math.random().toString(36).substring(7);
      const brokers = (process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092").split(",");
      const kafka = new Kafka({
        clientId: 'test-client-' + identifier,
        brokers,
        logLevel: logLevel.ERROR,
      });
  
      this.consumer = kafka.consumer({ groupId: "test-group-" + identifier });
  
      await this.consumer.connect();
  
      await this.consumer.subscribe({ topic: "products", fromBeginning: true });
    
      this.disconnect = function disconnect() {
        console.log("Disconnecting consumer");
        return this.consumer.disconnect();
      };

      this.receivedMessages = [];

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          console.log(`Received message: ${message.value.toString()}`);
          this.receivedMessages.push(JSON.parse(message.value.toString()));
        }
      });

      this.waitForMessage = async function(matcher) {
        if (hasMatch(this.receivedMessages, matcher)) {
          return true;
        }

        let messages = this.receivedMessages;
        await waitFor(() => {
          if (hasMatch(messages, matcher)) {
            return true;
          } else throw new Error("No message found yet");
        }, 10000);
      }

      return this;
    })();

  }
}

function hasMatch(objectList, subObject) {
  return objectList.some(obj => hasMatchSingle(obj, subObject));
}

function hasMatchSingle(fullObject, subObject) {
  return Object.entries(subObject).every(arr => fullObject[arr[0]] == arr[1])
}

async function waitFor(callback, timeout, interval = 100) {
  let timeWaited = 0;
  while (timeWaited < timeout) {
    try {
      callback();
      return;
    } catch (e) {}

    await new Promise((resolve) => setTimeout(resolve, interval));
    timeWaited += interval;
  }

  throw new Error("Timeout waiting for callback");
}

module.exports = {
  KafkaConsumer,
};