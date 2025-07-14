import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { getUserProfile } from "../../firebase/firestore/users";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons"; // Icon for menu
import Sidebar from "../../components/ui/sidebar";

const { width } = Dimensions.get("window");

export default function Home() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ 
    username: string; 
    photoURL?: string;
    streakCount?: number;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Sidebar (Fully Opaque) */}
      {sidebarOpen && <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.flagSidebarContainer}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.sidebarButton}>
              <FontAwesome name="bars" size={24} color="black" />
            </TouchableOpacity>
            
            <TouchableOpacity>
              <Image source={require("../../assets/images/kenya-flag.png")} style={styles.flagIcon} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello {userProfile?.username || "User"}</Text>
            <Text style={styles.subText}>Let's have fun!</Text>

            {/* Streak Count */}
            <View style={styles.streakWrapper}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <Text style={styles.streakCount}>{userProfile?.streakCount ?? 0}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Image
              source={userProfile?.photoURL ? { uri: userProfile.photoURL } : require("../../assets/images/profile-placeholder.png")}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* NAVIGATION BUTTONS */}
        <View style={styles.navButtons}>
          <TouchableOpacity style={styles.activeButton}>
            <Text style={styles.activeButtonText}>Learn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inactiveButton} onPress={() => router.push("/home/quiz")}>
            <Text style={styles.inactiveButtonText}>Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inactiveButton} onPress={() => router.push("/home/games")}>
            <Text style={styles.inactiveButtonText}>Games</Text>
          </TouchableOpacity>
        </View>

        {/* LEARNING CATEGORIES */}
        <View style={styles.categories}>
          <TouchableOpacity style={styles.category} onPress={() => router.push("/lessons/videos")}>
            <Image source={require("../../assets/images/videos.png")} style={styles.originalImage} />
            <Text style={styles.categoryText}>Videos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.category} onPress={() => router.push("/lessons/writing")}>
            <Image source={require("../../assets/images/writing.png")} style={styles.originalImage} />
            <Text style={styles.categoryText}>Writing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.category} onPress={() => router.push("/lessons/speaking")}>
            <Image source={require("../../assets/images/speaking.png")} style={styles.originalImage} />
            <Text style={styles.categoryText}>Speaking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.category} onPress={() => router.push("/lessons/listening")}>
            <Image source={require("../../assets/images/pronunciation.png")} style={styles.originalImage} />
            <Text style={styles.categoryText}>Listening</Text>
          </TouchableOpacity>
        </View>

        {/* GOALS SECTION */}
        <View style={styles.goalContainer}>
          <View style={styles.goalBox}>
            <Text style={styles.goalTitle}>DAILY GOAL</Text>
          </View>
          <View style={styles.goalBox}>
            <Text style={styles.goalTitle}>WEEKLY GOAL</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  flagSidebarContainer: {
    alignItems: "center",
  },
  flagIcon: {
    width: 30,
    height: 20,
    marginTop: 8,
  },
  sidebarButton: {
    marginBottom: 2,
  },
  userInfo: {
    alignItems: "center",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: "#7E7C7C",
  },
  streakWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  fireEmoji: {
    fontSize: 16,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
    color: "#FF7700",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
    marginTop: 20,
  },
  activeButton: {
    backgroundColor: "#F9DB82",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  inactiveButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  activeButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  inactiveButtonText: {
    color: "#7E7C7C",
    fontSize: 16,
  },
  categories: {
    alignItems: "center",
    marginTop: 20,
  },
  category: {
    alignItems: "center",
    marginVertical: 10,
  },
  originalImage: {
    width: 80, 
    height: 80,
    resizeMode: "contain", 
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
    color: "#000",
  },
  goalContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 20,
  },
  goalBox: {
    width: width * 0.4,
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
});