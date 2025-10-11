import React, { useState } from "react";
import { signOut } from "firebase/auth";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../lib/firebase";

export default function LoginScreen() {
  const router = useRouter();
  const [prefix, setPrefix] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!prefix) {
      Alert.alert("Missing info", "Please enter your BU email prefix.");
      return;
    }

    const email = `${prefix}@bu.edu`.toLowerCase().trim();

    try {
      setLoading(true);
      // For now, allow blank password — placeholder logic
      // If password empty, just simulate successful login
      if (!password) {
        Alert.alert("Login successful", "Signed in (dev mode, no password).");
        // Authentication state change will trigger redirect via index.tsx
        return;
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = result.user.email || "";
      const role = userEmail.includes("admin") ? "admin" : "user";

      Alert.alert("Login successful", `Signed in as ${role}.`);
      // Authentication state change will trigger redirect via index.tsx
    } catch (err: any) {
      console.error(err);
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged out", "Authentication state cleared.");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Logout failed", err.message);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#fff",
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: "600",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        BU Catering Leftovers (Dev)
      </Text>

      {/* Username input + @bu.edu suffix */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 16,
        }}
      >
        <TextInput
          placeholder="username"
          placeholderTextColor="#aaa"
          value={prefix}
          onChangeText={setPrefix}
          autoCapitalize="none"
          style={{
            flex: 1,
            paddingVertical: 12,
            fontSize: 16,
          }}
        />
        <Text style={{ color: "#888", fontSize: 16 }}>@bu.edu</Text>
      </View>

      {/* Password input (optional for now) */}
      <TextInput
        placeholder="password (optional)"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 16,
          marginBottom: 24,
        }}
      />

      {/* Login button */}
      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#99c2ff" : "#0066FF",
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>
            Log in
          </Text>
        )}
      </Pressable>

      {/* Debug: Clear Auth State button */}
      <Pressable
        onPress={handleLogout}
        style={{
          backgroundColor: "#ff4444",
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>
          Clear Auth State (Debug)
        </Text>
      </Pressable>
    </View>
  );
}
