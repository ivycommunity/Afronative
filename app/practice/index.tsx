import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
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

const { width, height } = Dimensions.get("window");

const cardColors = ["#FAD7A0", "#AED6F1", "#D8BFD8"];

// Define types explicitly
type PracticeCategory = {
  id: string;
  title: string;
  description: string;
  image: any;
  route: "/practice/writing" | "/practice/speaking" | "/practice/listening";
};

const practiceCategories: PracticeCategory[] = [
  {
    id: "1",
    title: "Writing",
    description: "Practice your writing today!",
    image: require("../../assets/images/writing_icon.png"),
    route: "/practice/writing",
  },
  {
    id: "2",
    title: "Speaking",
    description: "Improve your speaking skills!",
    image: require("../../assets/images/speaking_icon.png"),
    route: "/practice/speaking",
  },
  {
    id: "3",
    title: "Listening",
    description: "Sharpen your listening skills with interactive exercises!",
    image: require("../../assets/images/listening_icon.png"),
    route: "/practice/listening",
  },
];

export default function Practice() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    username: string;
    photoURL?: string;
    streakCount?: number;
    xpPoints?: number;
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
          <Text style={styles.greeting}>
            Hello {userProfile?.username || "User"}
          </Text>
          <Text style={styles.subText}>Let's Practice!</Text>

          {/* Streak Count */}
          <View style={styles.streakWrapper}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.streakCount}>
              {userProfile?.streakCount ?? 0}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={
              userProfile?.photoURL
                ? { uri: userProfile.photoURL }
                : require("../../assets/images/profile-placeholder.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* TOTAL XP CARD */}
      <View style={styles.xpCard}>
        <View style={styles.xpContent}>
          <Text style={styles.xpLabel}>Total XP</Text>
          <View style={styles.xpValueContainer}>
            <Text style={styles.lightningIcon}>⚡</Text>
            <Text style={styles.xpValue}>{userProfile?.xpPoints ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* PRACTICE CATEGORIES */}
      <FlatList
        data={practiceCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: cardColors[index % cardColors.length] },
            ]}
            onPress={() => router.push(item.route)}
          >
            <Image source={item.image} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.cardList}
      />
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
    marginTop: 8,
  },
  sidebarButton: {
    marginBottom: 2,
  },
  flagSidebarContainer: {
    alignItems: "center",
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
  xpCard: {
    backgroundColor: "#F9DB82", 
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginVertical: 20,
    width: width * 0.85,
    alignItems: "center",
  },
  xpContent: {
    flexDirection: "column",
    alignItems: "center",
  },
  xpLabel: {
    color: "#000", // Gold
    fontSize: 16,
    fontWeight: "bold",
  },
  xpValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  lightningIcon: {
    fontSize: 22,
    color: "#E9C46A",
    marginRight: 5,
  },
  xpValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  /* CARDS STYLES */
  cardList: {
    padding: 20,
  },
  card: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    width: width * 0.9,
    height: height * 0.2,
    alignSelf: "center",
  },
  cardImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
    marginRight: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  cardDescription: {
    fontSize: 16,
    color: "#555",
    marginTop: 5,
  },
});
