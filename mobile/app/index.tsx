// mobile/app/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ImageBackground, Alert } from "react-native";
import { useRouter } from "expo-router";
import mockUsers from "../../mock_data/users.json"; // ← imported from repo root

interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
  events: string[];
  reviews: string[];
  foodPref: string[];
  locPref: string[];
  timePref: string[];
}

export default function LoginScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (role: string) => {
    // find the first user with matching role
    const foundUser = (mockUsers as User[]).find(
      (u) => u.role.toLowerCase() === role.toLowerCase()
    );

    if (foundUser) {
      setUser(foundUser);
      Alert.alert("Login Successful", `Welcome, ${foundUser.name}!`);

      // Simulate navigation flow
      if (role.toLowerCase() === "admin" || role.toLowerCase() === "manager") {
        router.push("/events");
      } else {
        router.push("/terms");
      }
    } else {
      Alert.alert("Login Failed", "No user found with that role in mock_data.");
    }
  };

  return (
    <ImageBackground
      source={require("../../public/landing-page.png")}
      resizeMode="cover"
      className="flex-1 justify-center items-center bg-black"
    >
      <Text className="text-white text-3xl font-bold mb-10 drop-shadow-lg">
        Reduce Wasted Food
      </Text>

      {!user ? (
        <View className="flex-row space-x-4">
          <TouchableOpacity
            onPress={() => handleLogin("volunteer")}
            className="bg-red-600 px-6 py-3 rounded-full active:bg-red-700"
          >
            <Text className="text-white text-base font-semibold">Login (Volunteer)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleLogin("admin")}
            className="bg-red-600 px-6 py-3 rounded-full active:bg-red-700"
          >
            <Text className="text-white text-base font-semibold">Login (Admin)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="bg-red-600/90 px-6 py-3 rounded-full mt-10">
          <Text className="text-white text-base font-medium">
            Welcome, {user.name} ({user.role})
          </Text>
        </View>
      )}
    </ImageBackground>
  );
}
