import { useCallback, useState } from "react";

export function ProductRow({ product, onChange, onRecommend, highlighted }) {
  const [isRecommending, setIsRecommending] = useState(false);

  // Keep these functions for backend functionality but don't display in UI
  const fetchInventoryDetails = useCallback(() => {
    fetch(`/api/products/${product.id}`)
      .then((response) => response.json())
      .then(() => onChange());
  }, [product.id, onChange]);

  const getRecommendation = useCallback(() => {
    setIsRecommending(true);
    fetch(`/api/products/${product.id}/recommendations`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((recommendedProduct) => {
        onRecommend(recommendedProduct);
        setIsRecommending(false);
      })
      .catch((error) => {
        console.error("Error fetching recommendation:", error);
        setIsRecommending(false);
      });
  }, [product.id, onRecommend]);

  return (
    <tr className={highlighted ? "highlighted-row" : ""}>
      <td>{product.id}</td>
      <td>{product.name}</td>
      <td>{product.description}</td>
      <td>{product.category}</td>
      <td>{product.price}</td>
      <td>
        <button
          className="smaller"
          onClick={getRecommendation}
          disabled={isRecommending}
        >
          {isRecommending ? "Loading..." : "Recommend"}
        </button>
      </td>
    </tr>
  );
}
