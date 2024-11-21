import React, { useState } from "react";
import axios from "axios";

const DeletePaymentMethodPage: React.FC = () => {
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleDeletePaymentMethod = async () => {
    if (!customerId || !paymentMethodId) {
      setMessage("Customer ID and Payment Method ID are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.delete(
        "http://localhost:5005/api/v1/user/customerPaymentMethod",
        {
          data: {
            customerId,
            paymentMethodId,
          },
        }
      );

      setMessage(
        response.data?.data?.message || "Payment method deleted successfully!"
      );
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Error deleting payment method."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Delete Payment Method</h2>
      <div style={styles.formGroup}>
        <label style={styles.label}>Customer ID:</label>
        <input
          type="text"
          placeholder="Enter Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Payment Method ID:</label>
        <input
          type="text"
          placeholder="Enter Payment Method ID"
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
          style={styles.input}
        />
      </div>
      <button
        onClick={handleDeletePaymentMethod}
        style={styles.button}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete Payment Method"}
      </button>
      {message && (
        <p style={message.includes("success") ? styles.success : styles.error}>
          {message}
        </p>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#d9534f",
    color: "#fff",
    fontSize: "18px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  success: {
    color: "green",
    marginTop: "15px",
    textAlign: "center",
  },
  error: {
    color: "red",
    marginTop: "15px",
    textAlign: "center",
  },
};

export default DeletePaymentMethodPage;
