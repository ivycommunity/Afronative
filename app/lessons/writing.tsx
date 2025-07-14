import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AntDesign } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { getUserProfile } from "../../firebase/firestore/users";
import client from "../../firebase/storage/contentfulClient";

const { width, height } = Dimensions.get("window");

// Define lesson type
type Lesson = {
  id: string;
  title: string;
  language: string;
  level: string;
  typeOfLesson: string;
  content: string;
  completed?: boolean;
};

// Section colors
const sectionColors = ["#FAD7A0"];

export default function WritingLessonsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    username: string;
    photoURL?: string;
    streakCount?: number;
    xpPoints?: number;
  } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
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

  // Fetch writing lessons from Contentful
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const response = await client.getEntries({
          content_type: "kiswahiliLessonCollection",
          "fields.typeOfLesson": "Writing"
        });

        const writingLessons: Lesson[] = response.items.map((item: any) => ({
          id: item.sys.id,
          title: item.fields.lessonTitle || "Unnamed Writing Lesson",
          language: item.fields.language || "Kiswahili",
          level: item.fields.level || "Beginner",
          typeOfLesson: "Writing",
          content: item.fields.lessonContent || "No content available",
          completed: false,
        }));

        setLessons(writingLessons);
      } catch (error) {
        console.error("Error fetching writing lessons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const handleStartLesson = (lessonId: string) => {
    router.push({
      pathname: "/lessons/lessonid",
      params: { lessonid: lessonId },
    });
  };

  const renderLessonItem = (lesson: Lesson, index: number) => (
    <TouchableOpacity
      key={lesson.id}
      style={[styles.lessonCard, { backgroundColor: sectionColors[index % sectionColors.length] }]}
      onPress={() => handleStartLesson(lesson.id)}
    >
      <View style={styles.lessonCardContent}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <View style={styles.lessonMeta}>
          <Text style={styles.lessonLevel}>{lesson.level}</Text>
          {lesson.completed && <Text style={styles.completedBadge}>✓ Completed</Text>}
        </View>
      </View>
      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => handleStartLesson(lesson.id)}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push("/home")} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello {userProfile?.username || "User"}</Text>
          <Text style={styles.subText}>Writing Lessons</Text>

          {/* Streak Count */}
          <View style={styles.streakWrapper}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{userProfile?.streakCount ?? 0}</Text>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading writing lessons...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { backgroundColor: "#AED6F1" }]}>
              <Image 
                source={require("../../assets/images/writing.png")} 
                style={styles.sectionIcon} 
              />
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Writing Lessons</Text>
                <Text style={styles.sectionDescription}>Improve your written Kiswahili</Text>
              </View>
            </View>

            {lessons.length > 0 ? (
              lessons.map((lesson, idx) => renderLessonItem(lesson, idx))
            ) : (
              <View style={styles.noLessonsContainer}>
                <Text style={styles.noLessonsText}>No writing lessons available yet</Text>
                <Text style={styles.checkBackText}>Check back soon!</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

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
  backButton: {
    padding: 10,
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
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    marginVertical: 10,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 15,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  lessonCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonCardContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  lessonMeta: {
    flexDirection: "row",
    marginTop: 5,
    alignItems: "center",
  },
  lessonLevel: {
    fontSize: 12,
    color: "#555",
    backgroundColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completedBadge: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
    backgroundColor: "rgba(76,175,80,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  startButtonContainer: {
    marginLeft: 10,
  },
  startButton: {
    backgroundColor: "#F9DB82",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  noLessonsContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginVertical: 8,
  },
  noLessonsText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  checkBackText: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
  },
});