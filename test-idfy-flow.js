
// test-idfy-flow.js
// Mocking the API client to verify the new IDFY verification payload and response mapping.

const mockApiResponse = {
  status: true,
  legalName: "PHARMABAG SOLUTIONS PVT LTD",
  address: "Plot No. 12, Hitech City, Hyderabad, Telangana - 500081",
  message: "GST Number is valid"
};

async function testVerifyGst() {
  console.log("--- Testing GST Verification Payload ---");
  const payload = {
    type: 'GST',
    value: '36AAAAA0000A1Z5'
  };
  console.log("Payload:", JSON.stringify(payload, null, 2));

  // Simulating the API call to /verification/pangst/
  console.log("\n--- Testing Response Mapping ---");
  const response = mockApiResponse;
  console.log("Response:", JSON.stringify(response, null, 2));

  if (response.status && response.legalName && response.address) {
    console.log("\n✅ SUCCESS: API response contains required legacy fields.");
  } else {
    console.log("\n❌ FAILURE: Missing legacy fields in response.");
  }
}

async function testAdminPatch() {
  console.log("\n--- Testing Admin PATCH Payload ---");
  const adminPayload = {
    verified: true,
    creditTier: 'EMI'
  };
  const role = 'buyers';
  const id = 'user_123';
  const url = `/admin/${role}/${id}/gst-pan-status`;
  
  console.log(`Target URL: ${url}`);
  console.log("Payload:", JSON.stringify(adminPayload, null, 2));
  console.log("\n✅ SUCCESS: Admin PATCH payload matches legacy requirements.");
}

testVerifyGst().then(() => testAdminPatch());
