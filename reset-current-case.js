// Get case ID from command line
const caseId = process.argv[2];

if (!caseId) {
  console.error("Usage: node reset-current-case.js <CASE_ID>");
  process.exit(1);
}

console.log(`Resetting case ${caseId}...`);

fetch(`http://localhost:3000/api/disputes/${caseId}/messages`, {
  method: 'DELETE'
})
.then(res => res.json())
.then(data => {
  console.log("✅ Case reset successfully!");
  console.log(data);
  console.log("\nNow refresh your browser and start chatting again!");
})
.catch(err => {
  console.error("❌ Error:", err.message);
});
