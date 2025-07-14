import { router } from "expo-router";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from "react-native";
import { CheckBox } from "react-native-elements";

const options = [
  "I want to travel the country",
  "I want to work (eg: translator)",
  "Make it a hobby",
  "I want to pass time",
  "I want to understand different cultures",
  "Research",
];

const AccomplishmentScreen = () => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <Text style={styles.header}>What do you want to accomplish?</Text>
      <View style={styles.progressBar}>
        <View style={styles.progress} />
        <View style={styles.progressInactive} />
        <View style={styles.progressInactive} />
      </View>
      <Image source={require("../../assets/images/stairs_finger.png")} style={styles.image} />
      <FlatList
        data={options}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <CheckBox
            title={item}
            checked={selectedOptions.includes(item)}
            onPress={() => toggleOption(item)}
            containerStyle={styles.checkboxContainer}
          />
        )}
      />
          
      <TouchableOpacity style={styles.nextButton}
      onPress={() => router.push('/auth/CommitmentScreen')}>

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
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
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

export default AccomplishmentScreen;
