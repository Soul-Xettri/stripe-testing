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

const UpdatePaymentMethodPage: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [paymentId, setPaymentId] = useState("");
  const [isRetry, setIsRetry] = useState(false);
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
        setMessage("Payment method successfully authenticated and updated!");
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

  const handleUpdatePaymentMethod = async () => {
    if (!stripe || !elements) {
      setError("Stripe is not loaded yet.");
      return;
    }

    if (!paymentId) {
      setError("Payment ID is required.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card details are required.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          address: {
            country: "NP",
          },
        },
        metadata: {
          inApp: "true",
        },
      });

      if (error) {
        setError(error.message || "Failed to create payment method.");
        return;
      }

      const response = await axios.put(
        "https://betaapi.krofile.com/api/v1/auth/customerPaymentMethod",
        {
          oldPaymentMethodId: paymentId,
          paymentMethodId: paymentMethod?.id,
          country: paymentMethod?.billing_details.address?.country,
          zipCode: paymentMethod?.billing_details.address?.postal_code,
          isRetry,
        },
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjVmYmU5NWU5NmQzMmMxNDcxOWYxZiIsInR5cGUiOiJhdXRoIiwiaWF0IjoxNzQ0MTg0NTI3LCJleHAiOjE3NDQ1MzAxMjd9.TupYg9hW_Xw7qNd1lT1R_b2_jEZ9aTvOLGAZpNd8xxI",
            "x-refresh-token":
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjVmYmU5NWU5NmQzMmMxNDcxOWYxZiIsImlhdCI6MTc0NDE4NDUyMywiZXhwIjoxNzQ0NjE2NTIzfQ.HaVDNwvS_XZAB4J_25h2pANCkM7QzZE-kib2CcJRt-g",
          },
        }
      );

      if (response.data?.data?.message === "requires_confirmation") {
        const setupSuccess = await handleSetupIntent(
          response.data.data.setupIntentClientSecret,
          paymentMethod.id
        );

        if (setupSuccess) {
          const retryResponse = await axios.put(
            "https://betaapi.krofile.com/api/v1/auth/customerPaymentMethod",
            {
              oldPaymentMethodId: paymentId,
              paymentMethodId: paymentMethod?.id,
              country: paymentMethod?.billing_details.address?.country,
              zipCode: paymentMethod?.billing_details.address?.postal_code,
              isRetry: true,
            },
            {
              headers: {
                Authorization:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjVmYmU5NWU5NmQzMmMxNDcxOWYxZiIsInR5cGUiOiJhdXRoIiwiaWF0IjoxNzQ0MTg0NTI3LCJleHAiOjE3NDQ1MzAxMjd9.TupYg9hW_Xw7qNd1lT1R_b2_jEZ9aTvOLGAZpNd8xxI",
                "x-refresh-token":
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjVmYmU5NWU5NmQzMmMxNDcxOWYxZiIsImlhdCI6MTc0NDE4NDUyMywiZXhwIjoxNzQ0NjE2NTIzfQ.HaVDNwvS_XZAB4J_25h2pANCkM7QzZE-kib2CcJRt-g",
              },
            }
          );

          if (retryResponse.data?.data?.success) {
            setMessage(
              "Payment method updated successfully after confirmation."
            );
          } else {
            setError("Failed to update payment method after confirmation.");
          }
        }
      } else {
        setMessage("Payment method updated successfully.");
      }
    } catch (err) {
      setError("Error updating payment method.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">
        Update Payment Method
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Old Payment ID
        </label>
        <input
          type="text"
          placeholder="Enter Payment ID"
          value={paymentId}
          onChange={(e) => setPaymentId(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          checked={isRetry}
          onChange={(e) => setIsRetry(e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Retry failed payment
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Card Details
        </label>
        <div className="border p-3 rounded-md">
          <CardElement className="p-2" />
        </div>
      </div>

      <button
        onClick={handleUpdatePaymentMethod}
        disabled={loading || processing3DS}
        className={`w-full px-4 py-2 rounded-md text-white font-semibold ${
          loading || processing3DS
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading || processing3DS ? "Processing..." : "Update Payment Method"}
      </button>

      {message && <p className="mt-3 text-green-600 text-center">{message}</p>}
      {error && <p className="mt-3 text-red-600 text-center">{error}</p>}
    </div>
  );
};

const UpdatePaymentMethodWrapper: React.FC = () => (
  <Elements stripe={stripePromise}>
    <UpdatePaymentMethodPage />
  </Elements>
);

export default UpdatePaymentMethodWrapper;
