import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import mockUsers from "../mock_data/users.json";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// 👇 Hide header in Expo Router (works for v2 & v3)
export const unstable_settings = { headerShown: false };
export const options = { headerShown: false };

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const handleLogin = () => {
    const user = mockUsers.find((u) => u.email === email && u.role === role);
    if (user) {
      Alert.alert("Login Successful", `Welcome ${user.name}!`);
    } else {
      Alert.alert("Invalid Credentials", "Check your email or role again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 justify-center px-8">
      {/* Header Section */}
      <View className="items-center mb-8">
        <Image
          source={require("../assets/landing-page.png")}
          className="w-32 h-32 mb-4"
          resizeMode="contain"
        />
        <Text className="text-4xl font-bold text-gray-800 text-center">
          BU Catering Leftovers
        </Text>
      </View>

      {/* Login Form */}
      <View className="w-full bg-white rounded-2xl p-8 shadow-md shadow-black/10">
        {/* Email input */}
        <View className="mb-5">
          <Text className="text-gray-700 text-base mb-2">Email</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50">
            <Ionicons
              name="mail-outline"
              size={20}
              color="#999"
              className="ml-3"
            />
            <TextInput
              className="flex-1 p-3 text-base"
              placeholder="Enter your BU email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        {/* Role input */}
        <View className="mb-6">
          <Text className="text-gray-700 text-base mb-2">Role</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50">
            <Ionicons
              name="person-outline"
              size={20}
              color="#999"
              className="ml-3"
            />
            <TextInput
              className="flex-1 p-3 text-base"
              placeholder="admin / volunteer / manager"
              autoCapitalize="none"
              placeholderTextColor="#999"
              value={role}
              onChangeText={setRole}
            />
          </View>
        </View>

        {/* Login button */}
        <TouchableOpacity onPress={handleLogin}>
          <LinearGradient
            colors={["#FF7E5F", "#FD3A69"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 rounded-xl shadow-sm"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Log In
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer Section */}
      <Text className="text-gray-400 text-sm text-center mt-8">
        © 2025 BU Catering Leftovers Project
      </Text>
    </SafeAreaView>
  );
}
