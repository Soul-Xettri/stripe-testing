import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import "./Subscribe.css";

const stripePromise = loadStripe(
  "pk_test_51PmrfaJkN9y4JcdgqTA7JKrDsB7qmcsROJtxIMZTlEiOzgFJgXUBmTgg9TcnKawRNV1RkAuv1vmuy5nu1MrO8mlS002i3jGQS2"
);

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState<string>("soulchhetri@gmail.com");
  const [planName, setPlanName] = useState<string>("Standard");
  const [quantity, setQuantity] = useState<number>(100);
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [planId, setPlanId] = useState<string>("6755ab5e64f5a86aae4e5ded");
  const [processing3DS, setProcessing3DS] = useState<boolean>(false);

  const [billingDetails, setBillingDetails] = useState({
    name: "Rakesh Chhetri",
    businessName: "Anteiku",
    country: "US",
    city: "Pokhara",
    streetAddress1: "Lamachaur",
    streetAddress2: "",
    state: "Gandaki",
    zipCode: "33700",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const createSubscriptionRequest = async (
    paymentMethodId: string,
    isRetry: boolean = false
  ) => {
    try {
      const response = await axios.post(
        "https://betaapi.krofile.com/api/v1/auth/business/subscription",
        {
          name: billingDetails.name,
          email,
          quantity,
          paymentMethodId,
          customerEmail: email,
          planType,
          planName,
          planId,
          businessName: billingDetails.businessName,
          line1: billingDetails.streetAddress1,
          line2: billingDetails.streetAddress2,
          city: billingDetails.city,
          state: billingDetails.state,
          zipCode: billingDetails.zipCode,
          country: billingDetails.country,
          slotAddition: false,
          referral: true,
          referredById: "6761188c6d0ce13b90f0c1f5",
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

      return response.data;
    } catch (error) {
      throw error;
    }
  };

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
        setError(setupError.message || "Setup authentication failed");
        return false;
      }

      if (setupIntent.status === "succeeded") {
        console.log("Setup Intent succeeded, retrying subscription...");
        const retryResponse = await createSubscriptionRequest(
          paymentMethodId,
          true
        );

        if (retryResponse.status === "success") {
          if (retryResponse.data.message === "requires_confirmation") {
            return await handleSetupIntent(
              retryResponse.data.setupIntentClientSecret,
              paymentMethodId
            );
          } else if (retryResponse.data.message === "requires_action") {
            return await handlePaymentIntent(
              retryResponse.data.paymentIntentClientSecret,
              paymentMethodId
            );
          }
          console.log("Subscription retry successful"); // Debug log
          return true;
        } else {
          console.log("Subscription retry failed"); // Debug log
        }
      }

      setError("Setup failed");
      return false;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during setup verification"
      );
      return false;
    } finally {
      setProcessing3DS(false);
    }
  };

  const handlePaymentIntent = async (
    clientSecret: string,
    paymentMethodId: string
  ): Promise<boolean> => {
    if (!stripe) return false;

    setProcessing3DS(true);
    try {
      const { error: paymentError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret);

      if (paymentError) {
        setError(paymentError.message || "Payment authentication failed");
        return false;
      }

      if (paymentIntent.status === "succeeded") {
        // After successful payment confirmation, retry the subscription
        const retryResponse = await createSubscriptionRequest(
          paymentMethodId,
          true
        );

        if (retryResponse.status === "success") {
          console.log("Subscription retry successful", retryResponse);
          if (retryResponse.data.message === "requires_confirmation") {
            return await handleSetupIntent(
              retryResponse.data.setupIntentClientSecret,
              paymentMethodId
            );
          } else if (retryResponse.data.message === "requires_action") {
            return await handlePaymentIntent(
              retryResponse.data.paymentIntentClientSecret,
              paymentMethodId
            );
          } else {
            alert("Subscription created successfully!");
            return true;
          }
        } else {
          console.log("Subscription retry failed"); // Debug log
        }
      }

      setError("Payment failed");
      return false;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during payment verification"
      );
      return false;
    } finally {
      setProcessing3DS(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found.");
      setLoading(false);
      return;
    }

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: billingDetails.name,
          email,
          address: {
            line1: billingDetails.streetAddress1,
            line2: billingDetails.streetAddress2,
            city: billingDetails.city,
            country: billingDetails.country,
            state: billingDetails.state,
            postal_code: billingDetails.zipCode,
          },
        },
        metadata: {
          inApp: 'true',
        },
      });

      if (error) {
        setError(error.message || "Failed to create payment method.");
        setLoading(false);
        return;
      }

      if (!paymentMethod?.id) {
        setError("No payment method ID received");
        setLoading(false);
        return;
      }

      const response = await createSubscriptionRequest(paymentMethod.id);

      if (response.status === "success") {
        let success;
        if (response.data.message === "requires_confirmation") {
          success = await handleSetupIntent(
            response.data.setupIntentClientSecret,
            paymentMethod.id
          );
        } else if (response.data.message === "requires_action") {
          console.log("Before PaymentIntent 3DS"); // Add debug log
          success = await handlePaymentIntent(
            response.data.paymentIntentClientSecret,
            paymentMethod.id
          );

          if (!success) {
            setLoading(false);
            return;
          }
        } else {
          alert("Subscription created successfully!");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    }

    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBillingDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    <form onSubmit={handleSubmit} className="checkout-form">
      <h2>Subscribe to a Plan</h2>
      {/* Email */}
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {/* Plan Details */}
      <div className="form-group">
        <label htmlFor="planName">Plan Name</label>
        <select
          id="planName"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
        >
          <option value="Standard">Standard</option>
          <option value="Upgraded">Upgraded</option>
          <option value="Premium">Premium</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="planId">Plan ID</label>
        <input
          type="text"
          id="planId"
          placeholder="Enter your Plan ID"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="quantity">Quantity</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          min="1"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="planType">Plan Type</label>
        <select
          id="planType"
          value={planType}
          onChange={(e) => setPlanType(e.target.value as "monthly" | "yearly")}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      {/* Billing Details */}
      <h3>Billing Details</h3>
      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Enter your full name"
          value={billingDetails.name}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="businessName">Business Name</label>
        <input
          type="text"
          id="businessName"
          name="businessName"
          placeholder="Enter your business name"
          value={billingDetails.businessName}
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="country">Country</label>
        <select
          id="country"
          name="country"
          value={billingDetails.country}
          onChange={handleInputChange}
        >
          <option value="US">US</option>
          {/* Add other countries as needed */}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="city">City/Town</label>
        <input
          type="text"
          id="city"
          name="city"
          placeholder="City where your business is located"
          value={billingDetails.city}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="streetAddress1">Street Address 1</label>
        <input
          type="text"
          id="streetAddress1"
          name="streetAddress1"
          placeholder="Your primary street address"
          value={billingDetails.streetAddress1}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="streetAddress2">Street Address 2</label>
        <input
          type="text"
          id="streetAddress2"
          name="streetAddress2"
          placeholder="Building, suite, etc."
          value={billingDetails.streetAddress2}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="state">State/Province</label>
        <input
          type="text"
          id="state"
          name="state"
          placeholder="State or province"
          value={billingDetails.state}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="zipCode">Zip Code</label>
        <input
          type="text"
          id="zipCode"
          name="zipCode"
          placeholder="Enter your postal code"
          value={billingDetails.zipCode}
          onChange={handleInputChange}
          required
        />
      </div>
      {/* Card Details */}
      <h3>Card Details</h3>
      <div className="form-group">
        <CardElement id="card-element" options={cardElementOptions} />
      </div>
      {error && <div className="error">{error}</div>}
      {error && <div className="error">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading || processing3DS}
        className="btn-submit"
      >
        {loading
          ? "Processing..."
          : processing3DS
          ? "Authenticating..."
          : "Subscribe"}
      </button>
    </form>
  );
};

const Subscribe: React.FC = () => (
  <Elements stripe={stripePromise}>
    <div className="subscribe-page">
      <CheckoutForm />
    </div>
  </Elements>
);

export default Subscribe;
