import React from "react";
import { createStackNavigator, StackScreenProps } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import WelcomeScreen from "../auth/WelcomeScreen";
import CountrySelector from "../auth/CountrySelector";

// Define your stack parameter list with correct screen names
type RootStackParamList = {
  WelcomeScreen: undefined;
  CountrySelector: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WelcomeScreen">
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
        <Stack.Screen name="CountrySelector" component={CountrySelector} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
