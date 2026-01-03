import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import { auth } from "./firebase";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export async function loginAdmin(username, password) {
  if (!username || !password)
    throw new Error("Please enter credentials");

  if (
    username !== "Admin" ||
    password !== "Admin@123"
  ) {
    throw new Error("Invalid Credentials");
  }

  return signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export function logoutAdmin() {
  return signOut(auth);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}