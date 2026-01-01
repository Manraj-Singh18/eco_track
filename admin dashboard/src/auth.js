import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export async function loginAdmin(username, password){
  if(username !== "Admin" || password !== "Admin@123")
    throw new Error("Invalid Credentials");

  return signInWithEmailAndPassword(auth, "admin@ecotrack.com", "Admin@123");
}

export function logoutAdmin(){
  return signOut(auth);
}

export function watchAuth(callback){
  return onAuthStateChanged(auth, callback);
}
