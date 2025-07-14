import { router } from "expo-router";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from "react-native";
import { CheckBox } from "react-native-elements";

const options = [
  "10 minutes a day",
  "20 minutes a day",
  "30 minutes a day",
  "1 hour a day",
  "2 hours a day",
  "I'm not sure",
];

const CommitmentScreen = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <Text style={styles.header}>How long do you want to commit?</Text>
      <Text style={styles.note}>Note: This can be adjusted in settings</Text>
      <View style={styles.progressBar}>
        <View style={styles.progress} />
        <View style={styles.progressInactive} />
        <View style={styles.progressInactive} />
      </View>
      <Image source={require("../../assets/images/hourglass.png")} style={styles.image} />
      <FlatList
        data={options}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <CheckBox
            title={item}
            checked={selectedOption === item}
            onPress={() => setSelectedOption(item)}
            containerStyle={styles.checkboxContainer}
          />
        )}
      />
      <TouchableOpacity style={styles.nextButton}
            onPress={() => router.push('/auth/UnderstandingScreen')}>
      
              <Text style={styles.nextText}>Next</Text>
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
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  note: { fontSize: 12, fontStyle: "italic", color: "#555", marginBottom: 10 },
  progressBar: { flexDirection: "row", marginBottom: 10 },
  progress: { flex: 1, height: 5, backgroundColor: "#000" },
  progressInactive: { flex: 1, height: 5, backgroundColor: "#ccc" },
  image: { width: "100%", height: 150, resizeMode: "contain", marginBottom: 10 },
  checkboxContainer: { backgroundColor: "transparent", borderWidth: 0 },
  nextButton: {
    backgroundColor: "#f0a500",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default CommitmentScreen;
