import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import './App.css';

const stripePromise = loadStripe(
  "pk_test_51PmrfaJkN9y4JcdgqTA7JKrDsB7qmcsROJtxIMZTlEiOzgFJgXUBmTgg9TcnKawRNV1RkAuv1vmuy5nu1MrO8mlS002i3jGQS2"
); // Replace with your Stripe publishable key

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [trialDays, setTrialDays] = useState<number>(7);
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [planId, setPlanId] = useState<string>(""); // New planId field

  const [billingDetails, setBillingDetails] = useState({
    name: '',
    businessName: '',
    country: 'US',
    city: '',
    streetAddress1: '',
    streetAddress2: '',
    state: '',
    zipCode: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
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
      });

      if (error) {
        setError(error.message || "Failed to create payment method");
        setLoading(false);
        return;
      }

      // Send payment method, customer email, plan type, trialDays, and quantity to the backend
      const response = await axios.post(
        "http://localhost:5005/api/v1/user/subscription",
        {
          name:billingDetails.name,
          email, // Email of the user
          quantity, // Number of subscriptions or slots
          paymentMethodId: paymentMethod?.id, // Payment method from Stripe
          customerEmail: email,
          trialDays, // Trial days if applicable
          planType, // Plan type (monthly or yearly)
          planId, // Pass the selected planId
          businessName: billingDetails.businessName, // Business name
          line1: billingDetails.streetAddress1, // Billing address
          line2: billingDetails.streetAddress2, 
          city: billingDetails.city,
          state: billingDetails.state,
          zipCode: billingDetails.zipCode,
          country: billingDetails.country,
          slotAddition: false, // Set true if adding slots only
        }
      );

      if (response.data.status === "success") {
        alert("Subscription created successfully!");
      } else {
        setError("Failed to create subscription");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }

    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingDetails((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
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
        <label htmlFor="trialDays">Trial Days</label>
        <input
          type="number"
          id="trialDays"
          value={trialDays}
          onChange={(e) => setTrialDays(parseInt(e.target.value, 10))}
          min="0"
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

      {/* Plan ID Field */}
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

      {/* Billing Address Section */}
      <h2>Billing Address</h2>
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

      <div className="form-group">
        <label htmlFor="card-element">Card Details</label>
        <CardElement id="card-element" options={cardElementOptions} />
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <button type="submit" className="btn-submit" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Subscribe"}
      </button>
    </form>
  );
};

const App: React.FC = () => (
  <Elements stripe={stripePromise}>
    <div className="App">
      <h1>Subscribe to a Plan</h1>
      <CheckoutForm />
    </div>
  </Elements>
);

export default App;
