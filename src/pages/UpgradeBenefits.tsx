import { useState } from "react";
import { ArrowIcon, PayPalComponent } from "../components";
import { useNavigate, useLocation } from "react-router-dom";
import "./css/Upgrade.css";

export default function UpgradeBenefits() {
  const benefits = [
    "Unlimited groups to join or create",
    "Access to Synf1x Ultra",
    "Faster translation times",
    "Sender's voice on voice messages",
  ];

  const defaults = [
    "Up to 2 groups",
    "Synf1xation translation model",
    "Standard translation times",
    "Standard voice messages",
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const [showPayPal, setShowPayPal] = useState(
    new URLSearchParams(location.search).get("checkout") === "true"
  );

  const handleUpgradeClick = () => {
    setShowPayPal(true);
    navigate("/upgrade?checkout=true", { replace: true });
  };

  const handleBackClick = () => {
    navigate("/", { replace: true });
  };

  if (showPayPal) {
    return (
      <div className="upgrade-page">
        <button
          onClick={handleBackClick}
          className="back-button"
          aria-label="Back"
        >
          <ArrowIcon />
        </button>

        <div className="checkout-container">
          <div className="checkout-header">
            <span className="checkout-badge">SECURE CHECKOUT</span>
            <h1>Upgrade to <span>Pro</span></h1>
            <p>Unlock the full Synf1x experience.</p>
          </div>

          <div className="paypal-container">
            <PayPalComponent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upgrade-page">
      <button
        onClick={handleBackClick}
        className="back-button"
        aria-label="Back"
      >
        <ArrowIcon />
      </button>

      <div className="upgrade-content">
        <div className="upgrade-heading">
          <span className="upgrade-eyebrow">PLANS & PRICING</span>

          <h1>
            Upgrade your <span>Synf1x</span> experience
          </h1>

          <p>
            Get faster translations, unlimited groups, and our most advanced
            translation model.
          </p>
        </div>

        <div className="plans">
          <section className="plan-card basic-plan">
            <div className="plan-header">
              <div>
                <span className="plan-label">CURRENT PLAN</span>
                <h2>Basic</h2>
              </div>

              <div className="plan-price">
                <span>$0</span>
                <small>/ forever</small>
              </div>
            </div>

            <div className="plan-divider" />

            <div className="feature-list">
              {defaults.map((feature) => (
                <div className="feature" key={feature}>
                  <span className="feature-icon">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="plan-footer">
              <span>Your current plan</span>
            </div>
          </section>

          <section className="plan-card pro-plan">
            <div className="popular-badge">RECOMMENDED</div>

            <div className="plan-header">
              <div>
                <span className="plan-label">PREMIUM PLAN</span>
                <h2>
                  Synf1x <span>Pro</span>
                </h2>
              </div>

              <div className="plan-price">
                <span>$10</span>
                <small>/ month</small>
              </div>
            </div>

            <div className="plan-divider" />

            <div className="feature-list">
              {benefits.map((benefit) => (
                <div className="feature pro-feature" key={benefit}>
                  <span className="feature-icon">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgradeClick}
              className="upgrade-button"
            >
              <span>Upgrade to Pro</span>
              <span className="upgrade-arrow">→</span>
            </button>

            <p className="secure-note">
              Cancel anytime · Secure payment
            </p>
          </section>
        </div>

        <div className="upgrade-bottom">
          <span>Synf1x Pro</span>
          <span>•</span>
          <span>Faster. Smarter. Unlimited.</span>
        </div>
      </div>
    </div>
  );
}
