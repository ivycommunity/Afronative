import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Dimensions,
  Share,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "react-native";
import { getUserProfile, updateUserProfile } from "../../firebase/firestore/users";
import { uploadImageToCloudinary } from "../../firebase/storage/cloudinary";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const systemTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemTheme === "dark");
  const [userProfile, setUserProfile] = useState<{ username: string; photoURL: string }>({
    username: "User",
    photoURL: "",
  });

  // Effect to update theme when system theme changes
  useEffect(() => {
    setIsDarkMode(systemTheme === "dark");
  }, [systemTheme]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const profileData = await getUserProfile(user.uid);
          setUserProfile({
            username: profileData?.username ?? "User",
            photoURL: profileData?.photoURL ?? "",
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleUploadPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access the gallery is required!");
      return;
    }

    const imageResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!imageResult.canceled) {
      try {
        const uploadedUrl = await uploadImageToCloudinary(imageResult.assets[0].uri);
        if (uploadedUrl && user?.uid) {  
          await updateUserProfile(user.uid, { photoURL: uploadedUrl });
          setUserProfile((prev) => ({
            ...prev,
            photoURL: uploadedUrl,
          }));
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      }
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: "Hey! Join me on our language learning journey! Download the app now and let's learn together! 🌍📚",
        title: "Learn Languages Together",
        url: "https://your-app-store-link.com"
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Error sharing. Please try again.');
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push("/home")} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
      </View>

      {/* Profile Picture & User Info */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={handleUploadPhoto}>
          <Image
            source={
              userProfile.photoURL
                ? { uri: userProfile.photoURL }
                : require("../../assets/images/profile-placeholder.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <Text style={[styles.username, isDarkMode && styles.darkText]}>
          {userProfile.username}
        </Text>
        <Text style={[styles.email, isDarkMode && styles.darkText]}>
          {user?.email || ""}
        </Text>
        <Image
          source={require("../../assets/images/kenya-flag.png")}
          style={styles.flagIcon}
        />
      </View>

      
      {/* Streaks, Achievements, Reviews */}
      <View style={styles.statsContainer}>
        <Text style={[styles.statText, isDarkMode && styles.darkText]}>Streaks 🔥</Text>
        <Text style={[styles.statText, isDarkMode && styles.darkText]}>Achievements 🏆</Text>
        <Text style={[styles.statText, isDarkMode && styles.darkText]}>Review 🙂</Text>
      </View>

      {/* Language Selection */}
      <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Language</Text>
      <Picker
        selectedValue={"English"}
        onValueChange={() => {}}
        style={[styles.picker, isDarkMode && styles.darkPicker]}
      >
        <Picker.Item label="Kiswahili" value="kiswahili" />
        <Picker.Item label="Luganda" value="luganda" />
        <Picker.Item label="Amharic" value="amharic" />
      </Picker>

      {/* Theme Toggle */}
      <View style={styles.themeToggleContainer}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Light/Dark Mode</Text>
        <Switch value={!isDarkMode} onValueChange={toggleTheme} />
      </View>

      {/* Invite Friends */}
      <TouchableOpacity 
        style={[styles.inviteCard, isDarkMode && styles.darkInviteCard]}
        onPress={handleShare}
      >
        <View>
          <Text style={[styles.inviteText, isDarkMode && styles.darkText]}>Invite Friends</Text>
          <Text style={[styles.inviteSubText, isDarkMode && styles.darkText]}>
            Have fun with friends learning your favorite language.
          </Text>
        </View>
        <Image
          source={require("../../assets/images/add-friend-icon.png")}
          style={styles.inviteIcon}
        />
      </TouchableOpacity>

      {/* Progress Section */}
      <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Progress</Text>
      <View style={[styles.progressContainer, isDarkMode && styles.darkProgress]} />

      {/* Help & About Links */}
      <TouchableOpacity>
        <Text style={[styles.linkText, isDarkMode && styles.darkText]}>Help</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text style={[styles.linkText, isDarkMode && styles.darkText]}>About</Text>
      </TouchableOpacity>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 30,
  },
  darkContainer: {
    backgroundColor: "#000000",
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  flagIcon: {
    width: 30,
    height: 20,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
  },
  picker: {
    height: 50,
    backgroundColor: "#F5F5F5",
    marginVertical: 10,
  },
  darkPicker: {
    backgroundColor: "#222222",
    color: "#FFFFFF",
  },
  themeToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  inviteCard: {
    backgroundColor: "#F9DB82",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  darkInviteCard: {
    backgroundColor: "#FFD700",
  },
  inviteText: { 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  inviteSubText: { 
    fontSize: 12, 
    color: "#555" 
  },
  inviteIcon: { 
    width: 30, 
    height: 30 
  },
  progressContainer: { 
    height: 80, 
    backgroundColor: "#F5F5F5", 
    borderRadius: 10 
  },
  darkProgress: { 
    backgroundColor: "#222222" 
  },
  linkText: { 
    fontSize: 14, 
    color: "#000000", 
    marginVertical: 5 
  },
  darkText: { 
    color: "#FFFFFF" 
  },
  signOutContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  signOutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: "center",
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});