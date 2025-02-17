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
  "pk_test_51PmrfaJkN9y4JcdgqTA7JKrDsB7qmcsROJtxIMZTlEiOzgFJgXUBmTgg9TcnKawRNV1RkAuv1vmuy5nu1MrO8mlS002i3jGQS2"
);

const AddPaymentMethodPage: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing3DS, setProcessing3DS] = useState(false);

  const handleSetupIntent = async (
    clientSecret: string,
    paymentMethodId: string
  ) => {
    if (!stripe) return false;
    setProcessing3DS(true);
    try {
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: paymentMethodId,
        }
      );

      if (setupError) {
        setError(setupError.message || "3DS authentication failed");
        return false;
      }

      if (setupIntent.status === "succeeded") {
        setMessage("Payment method successfully authenticated and saved!");
        return true;
      }

      setError("Setup failed");
      return false;
    } catch (err) {
      setError("An error occurred during setup verification");
      return false;
    } finally {
      setProcessing3DS(false);
    }
  };

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

    try {
      setLoading(true);

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: { name: "User Name" },
      });

      if (error) {
        setError(error.message || "Failed to create payment method.");
        return;
      }

      const response = await axios.post(
        "http://localhost:5005/api/v1/auth/customerPaymentMethod",
        { paymentMethodId: paymentMethod?.id },
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YWM4NjU3ZWU1N2I1OTI2ZjEwMjc3NiIsInR5cGUiOiJhdXRoIiwiaWF0IjoxNzM5NDUzMDI1LCJleHAiOjE3Mzk3OTg2MjV9.oRaVR-JhjSmlj8gRsoaawMPHDzBhSmOgt6cASoBNIqY",
            "x-refresh-token":
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YWM4NjU3ZWU1N2I1OTI2ZjEwMjc3NiIsImlhdCI6MTczOTQ1MzAyMiwiZXhwIjoxNzM5ODg1MDIyfQ.a4MIt99wOGI6q5yDychYwon9cSQZWsiqKGxlaR8WIk0",
          },
        }
      );

      if (response.data.data.message === "requires_confirmation") {
        const setupSuccess = await handleSetupIntent(
          response.data.data.setupIntentClientSecret,
          paymentMethod.id
        );

        if (setupSuccess) {
          // Retry after confirmation
          const retryResponse = await axios.post(
            "http://localhost:5005/api/v1/auth/customerPaymentMethod",
            { paymentMethodId: paymentMethod?.id, isRetry: true },
            {
              headers: {
                Authorization:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YWM4NjU3ZWU1N2I1OTI2ZjEwMjc3NiIsInR5cGUiOiJhdXRoIiwiaWF0IjoxNzM5NDUzMDI1LCJleHAiOjE3Mzk3OTg2MjV9.oRaVR-JhjSmlj8gRsoaawMPHDzBhSmOgt6cASoBNIqY",
                "x-refresh-token":
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YWM4NjU3ZWU1N2I1OTI2ZjEwMjc3NiIsImlhdCI6MTczOTQ1MzAyMiwiZXhwIjoxNzM5ODg1MDIyfQ.a4MIt99wOGI6q5yDychYwon9cSQZWsiqKGxlaR8WIk0",
              },
            }
          );

          if (retryResponse.data.data.success) {
            setMessage("Payment method added successfully after confirmation.");
          } else {
            setError("Failed to add payment method after confirmation.");
          }
        }
      } else {
        setMessage("Payment method added successfully.");
      }
    } catch (err) {
      setError("Error adding payment method.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">
        Add Payment Method
      </h2>

      <div className="border p-3 rounded-md mb-4">
        <CardElement className="p-2" />
      </div>

      <button
        onClick={handleAddPaymentMethod}
        disabled={!stripe || loading || processing3DS}
        className={`w-full px-4 py-2 rounded-md text-white font-semibold ${
          loading || processing3DS
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading || processing3DS ? "Processing..." : "Add Payment Method"}
      </button>

      {message && <p className="mt-3 text-green-600 text-center">{message}</p>}
      {error && <p className="mt-3 text-red-600 text-center">{error}</p>}
    </div>
  );
};

const AddPaymentMethodWrapper: React.FC = () => (
  <Elements stripe={stripePromise}>
    <AddPaymentMethodPage />
  </Elements>
);

export default AddPaymentMethodWrapper;
