import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LockScreen } from "@/components/AppLock";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#388E3C" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
        headerBackTitle: "Назад",
        contentStyle: { backgroundColor: "#f5f5f5" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Личный Органайзер" }} />
      <Stack.Screen name="passwords" options={{ title: "Пароли" }} />
      <Stack.Screen name="notes" options={{ title: "Заметки" }} />
      <Stack.Screen name="todos" options={{ title: "Задачи" }} />
      <Stack.Screen name="generator" options={{ title: "Генератор паролей" }} />
      <Stack.Screen name="export" options={{ title: "Экспорт данных" }} />
      <Stack.Screen name="search" options={{ title: "Поиск" }} />
      <Stack.Screen name="pin" options={{ title: "Установить PIN-код" }} />
      <Stack.Screen
        name="settings"
        options={{ title: "Настройки", headerStyle: { backgroundColor: "#37474F" } }}
      />
      <Stack.Screen
        name="about"
        options={{ title: "О приложении", headerStyle: { backgroundColor: "#2E7D32" } }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [locked, setLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
    checkLock();
  }, []);

  const checkLock = async () => {
    try {
      const val = await AsyncStorage.getItem("biometric_enabled");
      if (val === "true") {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          setLocked(true);
        }
      }
    } catch {}
    setLockChecked(true);
  };

  useEffect(() => {
    if ((fontsLoaded || fontError) && lockChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, lockChecked]);

  if ((!fontsLoaded && !fontError) || !lockChecked) return null;

  if (locked) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <LockScreen onUnlock={() => setLocked(false)} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
