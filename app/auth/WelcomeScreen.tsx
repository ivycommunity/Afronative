import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { StackScreenProps } from "@react-navigation/stack";
import { router } from "expo-router";

// Define the navigation stack types
type RootStackParamList = {
  WelcomeScreen: undefined;
  CountrySelector: undefined;
};

type WelcomeScreenProps = StackScreenProps<RootStackParamList, "WelcomeScreen">;

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const [selectedCountry, setSelectedCountry] = useState("");

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/welcome.png")} style={styles.image} />
      <Text style={styles.title}>WELCOME</Text>
      <Text style={styles.subtitle}>What Country are you from?</Text>
      
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCountry}
          onValueChange={(itemValue) => setSelectedCountry(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Country" value="" />
          <Picker.Item label="Kenya" value="KE" />
          <Picker.Item label="Uganda" value="UG" />
          <Picker.Item label="Egypt" value="EGY" />
          <Picker.Item label="South Africa" value="SA" />
        </Picker>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/auth/CountrySelector')}
        disabled={!selectedCountry} // Prevent navigation if no country is selected
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  pickerContainer: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
  },
  picker: {
    width: "100%",
    height: 50,
  },
  button: {
    backgroundColor: "#ffcc00",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default WelcomeScreen;
