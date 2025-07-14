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

const { width } = Dimensions.get("window");

export default function Games() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ 
    username: string; 
    photoURL?: string;
    streakCount?: number;
  } | null>(null);

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <TouchableOpacity>
            <Image source={require("../../assets/images/kenya-flag.png")} style={styles.flagIcon} />
          </TouchableOpacity>
          
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
          <TouchableOpacity 
            style={styles.inactiveButton}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.inactiveButtonText}>Learn</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.inactiveButton}
            onPress={() => router.push("/home/quiz")}
          >
            <Text style={styles.inactiveButtonText}>Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activeButton}>
            <Text style={styles.activeButtonText}>Games</Text>
          </TouchableOpacity>
        </View>

        {/* ADD FRIENDS BUTTON (Moved to Right) */}
        <View style={styles.addFriendsContainer}>
          <TouchableOpacity style={styles.addFriendsButton}>
            <Image source={require("../../assets/images/add-friend-icon.png")} style={styles.addFriendsIcon} />
            <Text style={styles.addFriendsText}>Add Friends</Text>
          </TouchableOpacity>
        </View>

        {/* GAMES SECTION */}
        <View style={styles.gamesContainer}>
          <TouchableOpacity style={styles.gameItem}>
            <Image source={require("../../assets/images/word-search.png")} style={styles.gameIcon} />
            <Text style={styles.gameText}>Word Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gameItem}>
            <Image source={require("../../assets/images/crossword.png")} style={styles.gameIcon} />
            <Text style={styles.gameText}>Cross Word</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gameItem}>
            <Image source={require("../../assets/images/scrabble.png")} style={styles.gameIcon} />
            <Text style={styles.gameText}>Scrabble</Text>
          </TouchableOpacity>
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
  flagIcon: {
    width: 30,
    height: 20,
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
  
  /* Updated Add Friends Section */
  addFriendsContainer: {
    alignItems: "flex-end", // Align to the right
    marginRight: 20,
    marginTop: 10,
  },
  addFriendsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addFriendsIcon: {
    width: 30, // Increased size
    height: 30,
    marginRight: 5,
  },
  addFriendsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },

  gamesContainer: {
    alignItems: "center",
  },
  gameItem: {
    alignItems: "center",
    marginVertical: 15,
  },
  gameIcon: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  gameText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
    color: "#000",
  },
});

