#!/bin/bash

curl -X POST --data '{"name":"Test product","price":150}' -H "Content-type: application/json" http://localhost:3000/api/products