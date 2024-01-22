#!/usr/bin/env sh

set -x
# Initialize mongo replicaset
mongosh "mongodb://mongo:27017/nest?directConnection=true" --eval "rs.initiate()"

# Setup kafka connector
curl kafka-connect1:8083/connectors  -X POST -H "Content-Type: application/json" --data '{
  "name": "mongo-simple-source",
  "config": {
    "connector.class": "com.mongodb.kafka.connect.MongoSourceConnector",
    "connection.uri": "mongodb://mongo:27017/nest?directConnection=true",
    "database": "nest",
    "collection": "customers"
  }
}'
