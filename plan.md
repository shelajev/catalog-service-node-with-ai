# Implementation Plan for AI Product Recommendation Feature

## Step 1: Update Product Schema to Include Descriptions

1. Modify the database schema to add a description column to the products table:
   - Update the SQL schema file in `dev/db/1-create-schema.sql`
2. Update the ProductService.js to handle product descriptions:
   - Modify the createProduct and getProductById methods to include description
   - Update any relevant interfaces or types

## Step 2: Update API and Frontend to Support Descriptions

1. Modify the product creation endpoint to accept descriptions:
   - Update the POST /api/products endpoint in index.js
2. Update any existing tests to include product descriptions

## Step 3: Set up Ollama Container Support

1. Create a new Ollama container configuration for both development and testing:
   - Add Ollama container definition to the compose.yaml file for local development
   - Create a new Ollama Testcontainer class in the test/integration directory (similar to existing container support files)
   - Define environment variables for Ollama connection
   - Configure the container to use the llama3.2:3b model

## Step 4: Create AI Recommendation Service

1. Create a new service file `src/services/RecommendationService.js` that will:
   - Connect to the Ollama API
   - Provide methods to generate product recommendations based on product descriptions
   - Handle error cases with appropriate error throwing
   - Structure the prompt to allow for future extension to multiple recommendations

## Step 5: Create API Endpoints

1. Add new endpoints in `src/index.js`:
   - `GET /api/products/:id/recommendations` - to get AI-recommended products for a specific product
   - `GET /api/recommendations?productIds=1,2,3` - to get recommendations for multiple products

## Step 6: Implement the Recommendation Logic

1. Develop the core recommendation algorithm:
   - Create prompts that effectively analyze product descriptions
   - Implement filtering to ensure relevant recommendations
   - Structure the response to support returning multiple recommendations in the future
   - Initially configure to return 1 recommendation per request

## Step 7: Write Tests

1. Create unit tests for the RecommendationService
2. Create integration tests using Testcontainers:
   - Set up Ollama container with the llama3.2:3b model for testing
   - Test the recommendation endpoints
   - Verify recommendation quality and response format
   - Test error handling scenarios

## Step 8: Documentation

1. Update API documentation to include the new recommendation endpoints
2. Document the prompt structure and recommendation logic
3. Add examples of how to use the new recommendation features
