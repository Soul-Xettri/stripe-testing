import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";

const stripePromise = loadStripe(
  "pk_test_51PmrfaJkN9y4JcdgqTA7JKrDsB7qmcsROJtxIMZTlEiOzgFJgXUBmTgg9TcnKawRNV1RkAuv1vmuy5nu1MrO8mlS002i3jGQS2" // Replace with your Stripe publishable key
);

const AddPaymentMethodPage: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [customerId, setCustomerId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddPaymentMethod = async () => {
    setMessage("");
    setError("");

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet.");
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found.");
      return;
    }

    if (!customerId.trim()) {
      setError("Customer ID is required.");
      return;
    }

    try {
      setLoading(true);

      // Create a PaymentMethod using the card details
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: "User Name", // Add a name field if needed
        },
      });

      if (error) {
        setError(error.message || "Failed to create payment method.");
        setLoading(false);
        return;
      }

      // Send the PaymentMethod ID and Customer ID to the backend
      const response = await axios.post(
        "http://localhost:5005/api/v1/user/customerPaymentMethod",
        {
          customerId,
          paymentMethodId: paymentMethod?.id,
        }
      );

      setMessage(
        response.data.data.message || "Payment method added successfully."
      );
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error adding payment method.");
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#32325d",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Add Payment Method</h2>
      <div style={styles.formGroup}>
        <label htmlFor="customerId" style={styles.label}>
          Customer ID
        </label>
        <input
          type="text"
          id="customerId"
          placeholder="Enter Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label htmlFor="card-element" style={styles.label}>
          Card Details
        </label>
        <CardElement id="card-element" options={cardElementOptions} />
      </div>
      <button
        onClick={handleAddPaymentMethod}
        style={styles.button}
        disabled={!stripe || loading}
      >
        {loading ? "Adding..." : "Add Payment Method"}
      </button>
      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
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
    textAlign: "center" as const, // Explicit type for textAlign
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
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#5c67f2",
    color: "#fff",
    fontSize: "18px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  success: {
    color: "green",
    marginTop: "15px",
    textAlign: "center" as const,
  },
  error: {
    color: "red",
    marginTop: "15px",
    textAlign: "center" as const,
  },
};

const AddPaymentMethodWrapper: React.FC = () => (
  <Elements stripe={stripePromise}>
    <AddPaymentMethodPage />
  </Elements>
);

export default AddPaymentMethodWrapper;
