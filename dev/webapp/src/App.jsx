import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ProductRow } from "./ProductRow";

function App() {
  const [lastRequest, setLastRequest] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

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
      if (!recommendations.some((rec) => rec.id === product.id)) {
        setRecommendations((prev) => [...prev, product]);
      }
    },
    [recommendations],
  );

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

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
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((product) => (
                <tr key={`rec-${product.id}`}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>{product.price}</td>
                </tr>
              ))}
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
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>UPC</th>
                  <th>Inventory</th>
                  <th>Image</th>
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
