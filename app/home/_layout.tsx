import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />  {/* Learn Page */}
      <Stack.Screen name="quiz" />   {/* Quiz Page */}
      <Stack.Screen name="games" />  {/* Games Page */}
    </Stack>
  );
}
