// src/api/fakeBackend.ts

interface User {
  name: string;
  email: string;
  password: string;
}

// We'll store users in-memory
const users: User[] = [];

export function registerUser(name: string, email: string, password: string) {
  const existing = users.find((u) => u.email === email);
  if (existing) {
    return { success: false, message: "User already exists" };
  }
  users.push({ name, email, password });
  return { success: true, message: "Registered successfully" };
}

export function signInUser(email: string, password: string) {
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    return { success: true, user };
  }
  return { success: false, message: "Invalid email or password" };
}