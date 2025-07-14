import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import client from "../../firebase/storage/contentfulClient";
import { useAuth } from "../../hooks/useAuth";
import { getUserProfile } from "../../firebase/firestore/users";
import Markdown from 'react-native-markdown-display';


const { width } = Dimensions.get("window");

// Define interfaces for type safety
interface UserProfile {
  username?: string;
  photoURL?: string;
  // Add other user properties as needed
}

interface Lesson {
  id: string;
  lessonTitle: string;
  language: string;
  level: string;
  typeOfLesson: string;
  lessonContent: string;
  audioUrl: string;
  videoUrl: string;
}

// Type for Contentful entry fields
interface ContentfulFields {
  lessonTitle?: string;
  language?: string;
  level?: string;
  typeOfLesson?: string;
  lessonContent?: string;
  audio?: Array<{
    fields?: {
      file?: {
        url?: string;
      };
    };
  }>;
  video?: Array<{
    fields?: {
      file?: {
        url?: string;
      };
    };
  }>;
}

// Type for Contentful entry
interface ContentfulEntry {
  sys: {
    id: string;
  };
  fields: ContentfulFields;
}

export default function LessonDetail() {
  const { lessonid } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile as UserProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUser();
  }, [user]);

  // Fetch lesson data
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonid) {
        setError("No lesson ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Fetching lesson with ID:", lessonid);
        
        // Get the entry directly by ID
        const response = await client.getEntry(lessonid.toString()) as ContentfulEntry;
        
        if (!response || !response.fields) {
          throw new Error("Lesson not found or has no fields");
        }

        console.log("Successfully fetched lesson:", response.sys.id);
        
        // Process audio URL if present
        let audioUrl = "";
        if (response.fields.audio && 
            Array.isArray(response.fields.audio) && 
            response.fields.audio.length > 0 &&
            response.fields.audio[0]?.fields?.file?.url) {
          const fileUrl = response.fields.audio[0].fields.file.url;
          audioUrl = fileUrl.startsWith("http") ? fileUrl : `https:${fileUrl}`;
        }
        
        // Process video URL if present
        let videoUrl = "";
        if (response.fields.video && 
            Array.isArray(response.fields.video) && 
            response.fields.video.length > 0 &&
            response.fields.video[0]?.fields?.file?.url) {
          const fileUrl = response.fields.video[0].fields.file.url;
          videoUrl = fileUrl.startsWith("http") ? fileUrl : `https:${fileUrl}`;
        }
        
        // Create a processed lesson object with all needed fields
        const processedLesson: Lesson = {
          id: response.sys.id,
          lessonTitle: response.fields.lessonTitle || "Unnamed Lesson",
          language: response.fields.language || "Kiswahili",
          level: response.fields.level || "Beginner",
          typeOfLesson: response.fields.typeOfLesson || "videos",
          lessonContent: response.fields.lessonContent || "No content available",
          audioUrl: audioUrl,
          videoUrl: videoUrl,
        };
        
        setLesson(processedLesson);
      } catch (err) {
        console.error("Error loading lesson:", err);
        setError("Failed to load lesson. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonid]);

  // Handle audio playback
  const toggleAudio = async () => {
    if (!lesson || !lesson.audioUrl) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: lesson.audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleComplete = () => {
    // You could update lesson progress here
    router.push("/lessons/complete");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="black" />
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>{error || "Lesson not found"}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello {userProfile?.username || "User"}</Text>
          <Text style={styles.subText}>{lesson.lessonTitle}</Text>
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

      {/* LESSON CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle}>{lesson.lessonTitle}</Text>
          <Text style={styles.levelTag}>{lesson.level}</Text>
        </View>

        {lesson.audioUrl && (
          <TouchableOpacity style={styles.audioButton} onPress={toggleAudio}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
            <Text style={styles.audioText}>{isPlaying ? "Pause Audio" : "Play Audio"}</Text>
          </TouchableOpacity>
        )}

        {lesson.videoUrl && (
          <View style={styles.videoNote}>
            <Ionicons name="videocam" size={20} color="#555" />
            <Text style={styles.videoNoteText}>Video is available for this lesson</Text>
          </View>
        )}

        <Markdown style={markdownStyles}>
          {lesson.lessonContent}
        </Markdown>

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeText}>Mark as Complete</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#E53935",
    textAlign: "center",
    marginTop: 20,
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    marginTop: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  userInfo: {
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subText: {
    fontSize: 13,
    color: "#7E7C7C",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollContent: {
    padding: 20,
  },
  lessonHeader: {
    marginBottom: 20,
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  levelTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F9DB82",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    fontWeight: "600",
    marginBottom: 15,
  },
  audioButton: {
    flexDirection: "row",
    backgroundColor: "#4361EE",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioText: {
    color: "white",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  videoNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  videoNoteText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  lessonContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#222",
    marginBottom: 30,
  },
  completeButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 40,
  },
  completeText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});

// Define markdownStyles for the Markdown component
const markdownStyles = StyleSheet.create({
  // Body styles
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#222",
    marginBottom: 20,
  },
  // Heading styles
  heading1: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  heading2: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  heading3: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  heading4: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  heading5: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  heading6: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  // Paragraph styles
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: "#222",
  },
  // Link styles
  link: {
    color: "#4361EE",
    textDecorationLine: "underline",
  },
  // List styles
  list_item: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet_list: {
    marginLeft: 16,
    marginBottom: 16,
  },
  ordered_list: {
    marginLeft: 16,
    marginBottom: 16,
  },
  // Code styles
  code_inline: {
    backgroundColor: "#f5f5f5",
    padding: 4,
    borderRadius: 4,
    fontFamily: "monospace",
    color: "#C53030",
  },
  code_block: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
    fontFamily: "monospace",
  },
  // Blockquote styles
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#DDD",
    paddingLeft: 16,
    paddingVertical: 4,
    marginVertical: 8,
    fontStyle: "italic",
  },
  // Image styles
  image: {
    width: width - 40, // Full width minus padding
    height: 200,
    resizeMode: "cover",
    marginVertical: 16,
    borderRadius: 8,
  },
  // Table styles
  table: {
    borderWidth: 1,
    borderColor: "#DDD",
    marginVertical: 16,
  },
  thead: {
    backgroundColor: "#f5f5f5",
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },
  th: {
    padding: 8,
    fontWeight: "bold",
  },
  td: {
    padding: 8,
  },
});