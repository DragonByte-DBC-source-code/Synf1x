import React from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

import { useNavigate } from "react-router-dom";

import Loading from "./Loading";

const Buttons: React.FC = () => {
  const navigate = useNavigate();
  const [{ isPending }] = usePayPalScriptReducer();

  const createOrder = (_data: any, actions: any): Promise<string> =>
    actions.order.create({
      purchase_units: [{ amount: { value: "10.00", currency_code: "USD" } }],
    });

  const onApprove = (_data: any, actions: any): Promise<void> => {
    localStorage.setItem("isPro", "true");
    navigate("/");
    alert("Congrats on upgrading to pro!");
    return actions.order.capture();
  };
  const onError = (err: any): void => {
    console.error("Payment error:", err.message);
  };
  return (
    <div className="flex justify-center items-center h-screen bg-gray-800 ring-0">
      {isPending ? (
        <Loading />
      ) : (
        <div className="min-w-[50%] absolute">
          <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "pill" }}
            createOrder={(data: any, actions: any) =>
              createOrder(data, actions)
            }
            onApprove={(data: any, actions: any) => onApprove(data, actions)}
            onError={(err) => onError(err)}
          />
        </div>
      )}
    </div>
  );
};

const PayPalComponent: React.FC = () => {
  const opts: any = { "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID };

  return (
    <div
      className="flex justify-center items-center h-screen bg-gray-800 min-w-screen ring-0"
      onLoad={() => console.clear()}
    >
      <PayPalScriptProvider options={opts}>
          <Buttons />
      </PayPalScriptProvider>
      {/*No rings for the buttons*/}
      <style>
        {`
        div:focus, iframe:focus {
            outline: none;
        }
        `}
      </style>
    </div>
  );
};

export default PayPalComponent;
