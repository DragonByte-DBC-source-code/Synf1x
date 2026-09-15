import React from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import "./css/gradient.css";

const SERVER_URL = "http://localhost:8081";

const Buttons: React.FC = () => {
  const navigate = useNavigate();
  const [{ isPending }] = usePayPalScriptReducer();

  const createOrder = async (_data: any, actions: any): Promise<string> => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: "10.00",
            currency_code: "USD",
          },
        },
      ],
    });
  };

  const onApprove = async (_data: any, actions: any): Promise<void> => {
    await actions.order.capture();

    const uid = getAuth().currentUser?.uid;

    if (uid) {
      try {
        await fetch(`${SERVER_URL}/register`, {
          method: "POST",
          body: uid,
        });
      } catch (e) {
        console.error("Failed to register pro status:", e);
      }
    }

    localStorage.setItem("isPro", "true");

    navigate("/");
    alert("Congrats on upgrading to Pro!");
  };

  const onError = (err: any): void => {
    console.error("Payment error:", err?.message || err);
  };

  if (isPending) {
    return (
      <div className="paypal-loading">
        <Loading />
      </div>
    );
  }

  return (
    <div className="paypal-buttons-wrapper flex flex-col items-center">

      <PayPalButtons
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal",
          height: 48,
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
      />

      <div className="payment-security">
        <span className="security-icon">✓</span>
        <span className="pl-2">Secure payment processed by PayPal</span>
      </div>
    </div>
  );
};

const PayPalComponent: React.FC = () => {
  const opts = {
    "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };

  return (
    <div className="paypal-checkout w-full ">
      <PayPalScriptProvider options={opts}>
        <div className="paypal-card">
          <div className="paypal-header"></div>

          <div className="paypal-divider" />

          <div className="paypal-summary flex flex-col justify-between items-center">
            <div className="summary-row">
              <span className="pr-2">Access:</span>
              <span className="summary-muted">Immediate</span>
            </div>

            <div className="summary-row">
              <span className="pr-2">Total:</span>
              <strong>$10.00 USD</strong>
            </div>
          </div>
          <br />
          <div className="w-full">
            <Buttons />
          </div>
        </div>
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalComponent;
