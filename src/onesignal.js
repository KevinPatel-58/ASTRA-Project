import OneSignal from "react-onesignal";
let initialized = false;
export const initOneSignal = async () => {
  if (initialized) return;
  await OneSignal.init({
    appId: "88f2a843-6d51-4b8d-808c-c6824ed7492e",
    allowLocalhostAsSecureOrigin: true,
    
  });
  initialized=true;
};