#!/usr/bin/env node

/**
 * Local test script to verify Square credentials work
 * Run with: node scripts/test-payment-local.js
 */

const TOKEN = "EAAAlwtff8-YBlj4Hr5AVYfnb-4LbY9k0b8_59Ej5WOyTShOx37iT4w9Nut2PcIW";
const LOCATION_ID = "LSWR97SDRBXWK";

async function testSquarePayment() {
  console.log("=== Testing Square Payment API Directly ===\n");

  try {
    const response = await fetch("https://connect.squareup.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Square-Version": "2024-01-18",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_id: "cnon:test-nonce",
        amount_money: {
          amount: 100,
          currency: "USD",
        },
        location_id: LOCATION_ID,
        idempotency_key: `test-${Date.now()}`,
      }),
    });

    const data = await response.json();
    
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log("\n❌ 401 UNAUTHORIZED - Token is being rejected");
      console.log("This means the token in the script doesn't match what's in Vercel");
    } else if (data.errors && data.errors[0].code === "NOT_FOUND") {
      console.log("\n✅ TOKEN IS VALID!");
      console.log("Error is about invalid nonce (expected in production)");
      console.log("This proves the credentials work!");
    } else {
      console.log("\n⚠️  Unexpected response");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testSquarePayment();

