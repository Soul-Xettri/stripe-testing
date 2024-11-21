import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Subscribe from "./pages/subscription";
import AddPaymentMethodPage from "./pages/addPayment";
import UpdatePaymentMethodPage from "./pages/updatePayment";
import DeletePaymentMethodPage from "./pages/deletePayment";
import SetDefaultPaymentMethodPage from "./pages/defaultPayment";

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <h1>Subscription App</h1>
        <Routes>
          <Route path="/" element={<Subscribe />} />
          <Route path="/payment-methods" element={<AddPaymentMethodPage />} />
          <Route
            path="/update-payment-method"
            element={<UpdatePaymentMethodPage />}
          />
          <Route
            path="/set-default-payment-method"
            element={<SetDefaultPaymentMethodPage />}
          />
          <Route
            path="/delete-payment-method"
            element={<DeletePaymentMethodPage />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
