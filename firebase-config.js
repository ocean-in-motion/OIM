// ============================================================
// FIREBASE CONFIG — connected to the MCPhotography Firebase project.
//
// Still needed before uploads/login work (see SETUP.md for details):
// 1. Build > Firestore Database > Create database (Spark plan is fine).
// 2. Build > Authentication > Sign-in method > enable Email/Password,
//    then add yourself under the "Users" tab — that's the /admin login.
// 3. Build > Storage > Get started — this now requires the Blaze
//    (pay-as-you-go) plan, even for tiny/no-cost usage. Free quota
//    still applies on Blaze; it just needs a card on file.
//
// These values are safe to be public — Firebase security is enforced
// by the Firestore/Storage rules, not by hiding this config.
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBVBZToN0VLn7GLGFFuT1aLOVMJyyUppy4",
  authDomain: "mcphotography-8603b.firebaseapp.com",
  projectId: "mcphotography-8603b",
  storageBucket: "mcphotography-8603b.firebasestorage.app",
  messagingSenderId: "375449691841",
  appId: "1:375449691841:web:0d00bd0e74eb2a4101d640"
};
