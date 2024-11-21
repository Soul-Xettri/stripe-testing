import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";

const stripePromise = loadStripe(
  "pk_test_51PmrfaJkN9y4JcdgqTA7JKrDsB7qmcsROJtxIMZTlEiOzgFJgXUBmTgg9TcnKawRNV1RkAuv1vmuy5nu1MrO8mlS002i3jGQS2"
);

const UpdatePaymentMethodPage: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [customerId, setCustomerId] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>(""); // Added to capture the paymentId
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleUpdatePaymentMethod = async () => {
    try {
      if (!stripe || !elements) {
        setMessage("Stripe is not loaded yet.");
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setMessage("Card details are required.");
        return;
      }

      if (!customerId || !paymentId) {
        setMessage("Customer ID and Payment ID are required.");
        return;
      }

      setLoading(true);
      setMessage("");

      // Create a payment method using Stripe
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: "John Doe", // Replace with dynamic input if needed
        },
      });

      if (error) {
        setMessage(error.message || "Failed to create payment method.");
        setLoading(false);
        return;
      }

      // Send the paymentMethodId and paymentId to the backend
      const response = await axios.put(
        "http://localhost:5005/api/v1/user/customerPaymentMethod",
        {
          customerId,
          oldPaymentMethodId: paymentId, // Include paymentId explicitly
          paymentMethodId: paymentMethod?.id,
        }
      );

      setMessage(
        response.data?.data?.message || "Payment method updated successfully!"
      );
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Error updating payment method."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Update Payment Method</h2>
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
        <label style={styles.label}>Payment ID:</label>
        <input
          type="text"
          placeholder="Enter Payment ID"
          value={paymentId}
          onChange={(e) => setPaymentId(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Card Details:</label>
        <CardElement
          options={{
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
          }}
        />
      </div>
      <button
        onClick={handleUpdatePaymentMethod}
        style={styles.button}
        disabled={loading}
      >
        {loading ? "Updating..." : "Update Payment Method"}
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
    textAlign: "center",
  },
  error: {
    color: "red",
    marginTop: "15px",
    textAlign: "center",
  },
};

const UpdatePaymentMethodWrapper: React.FC = () => (
  <Elements stripe={stripePromise}>
    <UpdatePaymentMethodPage />
  </Elements>
);

export default UpdatePaymentMethodWrapper;
