#!/bin/bash
# Stripe Setup Verification Script
# Run this on your local machine to check your Stripe configuration

echo "=== Stripe Account Verification ==="
echo ""

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "Stripe CLI not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install stripe/stripe-cli/stripe || {
            echo "Failed to install via brew. Downloading manually..."
            curl -L "https://github.com/stripe/stripe-cli/releases/latest/download/stripe_$(uname -s)_$(uname -m).tar.gz" -o /tmp/stripe-cli.tar.gz
            tar -xzf /tmp/stripe-cli.tar.gz -C /tmp
            sudo mv /tmp/stripe /usr/local/bin/
        }
    else
        echo "Please install Stripe CLI manually: https://stripe.com/docs/stripe-cli"
        exit 1
    fi
fi

echo "✓ Stripe CLI is installed: $(stripe version)"
echo ""

# Try to login if not already logged in
echo "=== Checking Stripe Login ==="
if ! stripe config --list 2>/dev/null | grep -q "stripe.com"; then
    echo "You need to login to Stripe first."
    echo "Running: stripe login"
    stripe login
fi

echo ""
echo "=== Your Stripe Products ==="
stripe products list --limit 10

echo ""
echo "=== Your Stripe Prices ==="
stripe prices list --limit 10

echo ""
echo "=== Checking Your Environment Variables ==="
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    echo "Reading from $ENV_FILE..."
    SINGLE_PRICE=$(grep STRIPE_SINGLE_PRICE_ID "$ENV_FILE" | cut -d'=' -f2)
    TEAM_PRICE=$(grep STRIPE_TEAM_PRICE_ID "$ENV_FILE" | cut -d'=' -f2)
    BROKER_PRICE=$(grep STRIPE_BROKER_PRICE_ID "$ENV_FILE" | cut -d'=' -f2)

    echo ""
    echo "Price IDs in your .env.local:"
    echo "  SINGLE: $SINGLE_PRICE"
    echo "  TEAM: $TEAM_PRICE"
    echo "  BROKER: $BROKER_PRICE"

    echo ""
    echo "=== Verifying Price IDs Exist ==="

    if [ -n "$SINGLE_PRICE" ]; then
        echo "Checking SINGLE price ($SINGLE_PRICE)..."
        stripe prices retrieve "$SINGLE_PRICE" 2>&1 | head -5
    fi

    if [ -n "$TEAM_PRICE" ]; then
        echo "Checking TEAM price ($TEAM_PRICE)..."
        stripe prices retrieve "$TEAM_PRICE" 2>&1 | head -5
    fi

    if [ -n "$BROKER_PRICE" ]; then
        echo "Checking BROKER price ($BROKER_PRICE)..."
        stripe prices retrieve "$BROKER_PRICE" 2>&1 | head -5
    fi
else
    echo "No .env.local file found!"
fi

echo ""
echo "=== Webhook Configuration ==="
echo "To listen for webhooks locally, run:"
echo "  stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "Copy the webhook signing secret (whsec_...) and add it to your .env.local:"
echo "  STRIPE_WEBHOOK_SECRET=whsec_..."

echo ""
echo "=== Summary ==="
echo "Check the output above for any errors."
echo "If price IDs show 'No such price', you need to create them in the Stripe Dashboard."
echo "Dashboard: https://dashboard.stripe.com/products"
