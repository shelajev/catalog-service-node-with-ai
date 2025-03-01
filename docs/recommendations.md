# AI Product Recommendation Feature

This document describes the AI-powered product recommendation feature implemented in the catalog service.

## Overview

The recommendation feature uses the Ollama AI service with the llama3.2:3b model to generate product recommendations based on product descriptions. The system analyzes product descriptions and suggests related products that might interest customers.

## API Endpoints

### Get Recommendation for a Single Product

```
GET /api/products/:id/recommendations
```

Returns a recommendation for a specific product based on its description.

**Parameters:**

- `id` (path parameter): The ID of the product to get recommendations for

**Response:**

```json
{
  "sourceProductId": 1,
  "recommendedProduct": {
    "id": 2,
    "name": "Product Name",
    "upc": "123456789012",
    "price": 99.99,
    "description": "Product description",
    "has_image": false,
    "inventory": {
      "quantity": 10,
      "warehouse": "Main"
    }
  }
}
```

**Error Responses:**

- `404 Not Found`: If the product doesn't exist
- `400 Bad Request`: If the product ID is invalid
- `500 Internal Server Error`: For other errors

### Get Recommendations for Multiple Products

```
GET /api/recommendations?productIds=1,2,3
```

Returns recommendations for multiple products in a single request.

**Parameters:**

- `productIds` (query parameter): Comma-separated list of product IDs

**Response:**

```json
[
  {
    "sourceProductId": 1,
    "recommendedProduct": {
      "id": 2,
      "name": "Product Name",
      "upc": "123456789012",
      "price": 99.99,
      "description": "Product description",
      "has_image": false,
      "inventory": {
        "quantity": 10,
        "warehouse": "Main"
      }
    }
  },
  {
    "sourceProductId": 2,
    "recommendedProduct": {
      "id": 3,
      "name": "Another Product",
      "upc": "223456789012",
      "price": 149.99,
      "description": "Another product description",
      "has_image": true,
      "inventory": {
        "quantity": 5,
        "warehouse": "Main"
      }
    }
  }
]
```

**Error Responses:**

- `400 Bad Request`: If no valid product IDs are provided
- `500 Internal Server Error`: For other errors

## Implementation Details

### Recommendation Logic

The recommendation system works as follows:

1. When a recommendation is requested for a product, the system retrieves the product's description
2. The system then retrieves all other products in the catalog
3. A prompt is constructed that includes the source product and all potential recommendation candidates
4. The prompt is sent to the Ollama AI service using the llama3.2:3b model
5. The AI analyzes the descriptions and returns the ID of the most relevant product
6. The system retrieves the full details of the recommended product and returns it

### Prompt Structure

The system uses a carefully designed prompt to guide the AI in making relevant recommendations:

```
You are a product recommendation system. Based on the following product:

Product ID: {id}
Name: {name}
Description: {description}

Please recommend ONE product from the following list that would be most relevant to someone interested in the above product:

{list of other products with IDs, names, and descriptions}

Analyze the descriptions and recommend the most relevant product.
Your response should be ONLY the Product ID of the recommended product, nothing else.
```

### Error Handling

The recommendation system includes robust error handling:

- Products without descriptions will return an appropriate error
- Non-existent products will return a 404 error
- If the AI response cannot be parsed correctly, the system will fall back to a random recommendation
- Multiple product recommendations will continue processing even if individual recommendations fail

## Configuration

The recommendation service can be configured using the following environment variables:

- `OLLAMA_API_URL`: The URL of the Ollama API (default: "http://ollama:11434")
- `OLLAMA_MODEL`: The model to use for recommendations (default: "llama3.2:3b")

## Development and Testing

For local development, the Ollama service is included in the Docker Compose configuration. For testing, a dedicated Ollama Testcontainer is used to ensure isolated and reproducible tests.

The integration tests verify:

- Recommendations for products with descriptions
- Multiple product recommendations
- Error handling for products without descriptions
- Error handling for non-existent products
