import React from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

import { useNavigate } from "react-router-dom";

import Loading from "./Loading";

import "./css/gradient.css";

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
    localStorage.removeItem("showPayPal");
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
        <div className="md:min-w-[40%] absolute max-sm:min-w-[50%]">
          <PayPalButtons
            style={{ layout: "horizontal", color: "blue", shape: "pill" }}
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

const Text: React.FC = () => (
  <p
    className="text-5xl font-bold break-words ml-2 text-white bottom-[60%] absolute"
  >
    Upgrade with <i>Paypal</i>
    <div className="my-4" />
  </p>
);

const PayPalComponent: React.FC = () => {
  const opts: any = { "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID };

  return (
    <div
      className="flex flex-col justify-center items-center h-screen bg-gray-800 min-w-screen ring-0"
      onLoad={() => console.clear()}
    >
      <PayPalScriptProvider options={opts}>
        <Text />
        <Buttons />
        <div className="bg-gray-800 h-7 w-full bottom-[43%] absolute text-center text-transparent z-[100]" />
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
