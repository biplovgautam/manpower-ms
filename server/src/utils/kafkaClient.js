const { Kafka, logLevel } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'manpower-app',
  brokers: [process.env.KAFKA_BROKER],
  logLevel: logLevel.ERROR, 
  ssl: true, 
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
  // --- HARDENING FOR CLOUD AUTHORIZATION ---
  connectionTimeout: 10000,
  authenticationTimeout: 10000,
  // This tells KafkaJS NOT to ask for metadata about topics it doesn't need
  // It stops the "Describe All" behavior that triggers the Auth error
  allowAutoTopicCreation: false, 
  metadataMaxAge: 300000 
});

const producer = kafka.producer({
    // Ensures producer only asks for the specific topic metadata it's sending to
    allowAutoTopicCreation: false
});

const consumer = kafka.consumer({ 
  groupId: 'manpower-notification-bridge-group',
  // Helps with stability in Serverless environments
  sessionTimeout: 30000,
  heartbeatInterval: 10000,
});

const connectKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
    console.log('🚀 Connected to Redpanda Cloud Successfully');
  } catch (error) {
    console.error('❌ Redpanda Connection Error:', error.message);
  }
};

module.exports = { kafka, producer, consumer, connectKafka };