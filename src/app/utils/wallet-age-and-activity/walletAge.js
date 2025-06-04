import Moralis from 'moralis';

try {
  await Moralis.start({
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImNlYjNjMTJiLTc2ZmUtNDYxOS1iOTZjLWJiMDYyYWNiNGY2MCIsIm9yZ0lkIjoiNDQ2NDI4IiwidXNlcklkIjoiNDU5MzEyIiwidHlwZUlkIjoiODgwZjFkNGEtZTE0MC00ZDMyLWFlNGYtMzhjMDNmNmUxNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDY5NDYxNzUsImV4cCI6NDkwMjcwNjE3NX0.2MVKUCzFBKKTyiW0x_aykjkNC6pcqgohWi_iTIcCThs"
  });

  const response = await Moralis.EvmApi.wallets.getWalletActiveChains({
    "chains": [
      "0x1"
    ],
    "address": "0x5AFD81FaC3BD2B1BA5C9716a140C6bB1D159b79A"
  });

  console.log(JSON.stringify(response.raw, null, 2));
} catch (e) {
  console.error(e);
}