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

curl kafka-connect1:8083/connectors -X POST -H "Content-Type: application/json" --data '{
  "name": "clickhouse-sink",
  "config": {
    "name": "clickhouse-sink",
    "connector.class": "com.clickhouse.kafka.connect.ClickHouseSinkConnector",
    "topics": "message_status",
    "hostname": "clickhouse",
    "port": "8123",
    "username": "default",
    "database": "default",
    "value.converter.schemas.enable": "false",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "schemas.enable": "false",
    "transforms": "TimestampConverter",
    "transforms.TimestampConverter.target.type": "string",
    "transforms.TimestampConverter.field": "createdAt",
    "transforms.TimestampConverter.type": "org.apache.kafka.connect.transforms.TimestampConverter$Value",
    "transforms.TimestampConverter.format": "yyyy-MM-dd'T'hh:mm:ss"
  }
}'