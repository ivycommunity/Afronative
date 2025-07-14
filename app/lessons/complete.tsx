import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { getUserProfile } from "../../firebase/firestore/users";
import { useRouter } from "expo-router";

export default function LessonComplete() {
  const { user } = useAuth();
  const router = useRouter();
  const [xpPoints, setXpPoints] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setXpPoints(profile?.xpPoints ?? 0); // Ensure XP is displayed even if 0
        } catch (error) {
          console.error("Error fetching XP:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Lesson Complete Title */}
      <Text style={styles.title}>Lesson Complete!</Text>

      {/* Character Image */}
      <Image
        source={require("../../assets/images/lesson-complete.webp")}
        style={styles.characterImage}
      />

      {/* XP Box */}
      <View style={styles.xpContainer}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpHeaderText}>Total XP</Text>
        </View>
        <View style={styles.xpBody}>
          <Text style={styles.lightningIcon}>⚡</Text>
          <Text style={styles.xpValue}>{xpPoints}</Text>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={() => router.push("/home")}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 36, 
    fontWeight: "bold",
    color: "#FFB300", 
    marginBottom: 20,
  },
  characterImage: {
    width: 220, 
    height: 220,
    marginBottom: 20,
    resizeMode: "contain",
  },
  xpContainer: {
    width: 100, 
    height: 100,
    backgroundColor: "#FFFFFF", 
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40, 
    borderWidth: 7,
    borderColor: "#F9DB82", 
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  xpHeader: {
    position: "absolute",
    top: -20, 
    backgroundColor: "#F9DB82", 
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  xpHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  xpBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  lightningIcon: {
    fontSize: 22, 
    marginRight: 5,
    color: "#FFCC00",
  },
  xpValue: {
    fontSize: 22, 
    fontWeight: "bold",
    color: "#FF7700",
  },
  continueButton: {
    backgroundColor: "#F9DB82", 
    paddingVertical: 14,
    width: "85%", 
    borderRadius: 30,
    alignItems: "center",
    marginTop: 55, 
  },
  continueText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});


