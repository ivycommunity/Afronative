import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";

const UnderstandingScreen = () => {
  const [selectedLevel, setSelectedLevel] = useState("LEVELS");

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <Text style={styles.header}>
        <Text style={styles.boldText}>How much</Text> do you understand
      </Text>
      <Text style={styles.header}>the language?</Text>
      <View style={styles.progressBar}>
        <View style={styles.progress} />
        <View style={styles.progress} />
        <View style={styles.progressInactive} />
      </View>
      <Image source={require("../../assets/images/lady.png")} style={styles.image} />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLevel}
          onValueChange={(itemValue) => setSelectedLevel(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="LEVELS" value="LEVELS" />
          <Picker.Item label="Beginner" value="Beginner" />
          <Picker.Item label="Intermediate" value="Intermediate" />
          <Picker.Item label="Advanced" value="Advanced" />
        </Picker>
      </View>
      <TouchableOpacity style={styles.finishButton}
      onPress={() => router.replace('/home')}>
        <Text style={styles.finishText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  skipButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  skipText: { fontWeight: "bold", color: "#000" },
  header: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  boldText: { fontWeight: "bold", color: "#F0A500" },
  progressBar: { flexDirection: "row", justifyContent: "center", marginVertical: 10 },
  progress: { width: 30, height: 5, backgroundColor: "#000", marginHorizontal: 2 },
  progressInactive: { width: 30, height: 5, backgroundColor: "#ccc", marginHorizontal: 2 },
  image: { width: "100%", height: 150, resizeMode: "contain", marginBottom: 20 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
  },
  picker: { height: 50, width: "100%" },
  finishButton: {
    backgroundColor: "#f0a500",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  finishText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default UnderstandingScreen;
