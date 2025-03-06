import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ProductRow } from "./ProductRow";

function App() {
  const [lastRequest, setLastRequest] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [savingRecommendation, setSavingRecommendation] = useState(null);

  const fetchCatalog = useCallback(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => {
        setCatalog(data);
        setLastRequest({
          method: "GET",
          url: "/api/products",
          status: 200,
          response: data,
        });
      });
  }, []);

  const createProduct = useCallback(() => {
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then(fetchCatalog);
  }, [fetchCatalog]);

  const addRecommendation = useCallback(
    (product) => {
      console.log("Recommendation received:", product);
      if (
        !recommendations.some((rec) => {
          // Handle both possible structures
          const recId =
            rec.id || (rec.recommendedProduct && rec.recommendedProduct.id);
          const productId =
            product.id ||
            (product.recommendedProduct && product.recommendedProduct.id);
          return recId === productId;
        })
      ) {
        setRecommendations((prev) => [...prev, product]);
      }
    },
    [recommendations],
  );

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
  }, []);

  const saveRecommendation = useCallback((recommendation) => {
    // Handle both possible structures
    const recId =
      recommendation.id ||
      (recommendation.recommendedProduct &&
        recommendation.recommendedProduct.id);

    setSavingRecommendation(recId);

    // Determine the correct structure based on the recommendation object
    if (recommendation.sourceProductId && recommendation.recommendedProduct) {
      // New structure - save the recommended product first
      fetch("/api/recommended-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceProductId: recommendation.sourceProductId,
          recommendedProduct: recommendation.recommendedProduct,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            // Try to get the detailed error message from the response
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `Failed to save recommendation (${response.status})`,
            );
          }
          return response.json();
        })
        .then(() => {
          // Show success feedback
          alert("Recommendation saved successfully!");
        })
        .catch((error) => {
          console.error("Error saving recommendation:", error);
          alert(`Failed to save recommendation: ${error.message}`);
        })
        .finally(() => {
          setSavingRecommendation(null);
        });
    } else {
      // Old structure or unknown - try the old way
      // This is a fallback and might not work correctly
      alert("Cannot save this recommendation - invalid format");
      setSavingRecommendation(null);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Helper function to safely get product properties regardless of structure
  const getProductProperty = (recommendation, property) => {
    if (
      recommendation.recommendedProduct &&
      recommendation.recommendedProduct[property] !== undefined
    ) {
      return recommendation.recommendedProduct[property];
    }
    return recommendation[property];
  };

  return (
    <>
      <h1>Demo catalog client</h1>

      {recommendations.length > 0 && (
        <div className="recommendations-container">
          <div className="recommendations-header">
            <h2>Recommended Products</h2>
            <button
              className="clear-recommendations"
              onClick={clearRecommendations}
              title="Clear recommendations"
            >
              X
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Category</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((recommendation) => {
                const id = getProductProperty(recommendation, "id");
                return (
                  <tr key={`rec-${id}`}>
                    <td>{id}</td>
                    <td>{getProductProperty(recommendation, "name")}</td>
                    <td>{getProductProperty(recommendation, "description")}</td>
                    <td>{getProductProperty(recommendation, "category")}</td>
                    <td>{getProductProperty(recommendation, "price")}</td>
                    <td>
                      <button
                        className="save-recommendation"
                        onClick={() => saveRecommendation(recommendation)}
                        disabled={savingRecommendation === id}
                        title="Save recommendation"
                      >
                        {savingRecommendation === id ? "..." : "+"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p>
        <button onClick={fetchCatalog}>Refresh catalog</button>
        &nbsp;
        <button onClick={createProduct}>Create product</button>
      </p>

      {catalog ? (
        <>
          {catalog.length === 0 ? (
            <em>There are no products... yet!</em>
          ) : (
            <table className="full-width-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onChange={() => fetchCatalog()}
                    onRecommend={addRecommendation}
                  />
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <p>Loading catalog...</p>
      )}
    </>
  );
}

export default App;
