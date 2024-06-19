import React from "react";
import { useCallback } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import Dashboard from "../components/dashboard";

const HomePage = () => {
  const [fontsLoaded, fontError] = useFonts({
    Sora: require("../assets/fonts/Sora-Regular.ttf"),
    "Sora-SemiBold": require("../assets/fonts/Sora-SemiBold.ttf"),
    "Sora-Medium": require("../assets/fonts/Sora-Medium.ttf"),
  });
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View className="flex-1" onLayout={onLayoutRootView}>
      <Dashboard />
    </View>
  );
};

export default HomePage;
