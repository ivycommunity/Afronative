import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { getUserProfile } from "../../firebase/firestore/users";
import { router } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import client from "../../firebase/storage/contentfulClient";

const { width } = Dimensions.get("window");

type Exercise = {
  id: string;
  lesson: string;
  prompt: string;
  correct_answer: string;
  options: string[];
  media?: string;
};

export default function WritingPractice() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    username: string;
    photoURL?: string;
    streakCount?: number;
  } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch Writing Exercises from Contentful
  useEffect(() => {
    const fetchWritingExercises = async () => {
      setLoading(true);
      try {
        const response = await client.getEntries({
          content_type: "kiswahiliExerciseCollection",
          "fields.typeOfExercise": "Writing",
        });

        // Log minimal information for debugging
        if (response.items.length > 0) {
          console.log(
            "Fetched exercises count:",
            response.items.length,
            "| First Exercise ID:",
            response.items[0].sys.id
          );
        } else {
          console.log("No exercises found in Contentful.");
        }

        const fetchedExercises: Exercise[] = response.items.map((item: any) => {
          let mediaUrl = "";

          // Check if media exists in fields
          if (item.fields.media) {
            if (item.fields.media.fields && item.fields.media.fields.file) {
              // Direct asset reference
              const fileUrl = item.fields.media.fields.file.url;
              mediaUrl = fileUrl.startsWith("http") ? fileUrl : `https:${fileUrl}`;
            } else if (
              Array.isArray(item.fields.media) &&
              item.fields.media.length > 0
            ) {
              // Array of assets
              const mediaItem = item.fields.media[0];
              if (mediaItem.fields && mediaItem.fields.file) {
                const fileUrl = mediaItem.fields.file.url;
                mediaUrl = fileUrl.startsWith("http") ? fileUrl : `https:${fileUrl}`;
              }
            }
          }

          return {
            id: item.sys.id,
            lesson: String(item.fields.lessonTitle || "Unknown Lesson"),
            prompt: String(item.fields.questionprompt || "No prompt available"),
            correct_answer: String(item.fields.correctAnswer || ""),
            options: Array.isArray(item.fields.multipleChoice)
              ? item.fields.multipleChoice.map(String)
              : [],
            media: mediaUrl,
          };
        });

        setExercises(fetchedExercises);
      } catch (error) {
        console.error("Error fetching writing exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWritingExercises();
  }, []);

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

  const currentExercise = exercises[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (option === currentExercise?.correct_answer) {
      setFeedback("Correct! ✅");
      setScore((prevScore) => prevScore + 10);
    } else {
      setFeedback("Incorrect ❌");
    }

    setTimeout(() => {
      if (currentQuestionIndex < exercises.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        router.push("/practice");
      }
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.push("/practice")}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>
            Hello {userProfile?.username || "User"}
          </Text>
          <Text style={styles.subText}>Let's Practice!</Text>
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
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : currentExercise ? (
        <>
          {/* Media (Image) */}
          {currentExercise.media && (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: currentExercise.media }}
                style={styles.media}
              />
            </View>
          )}

          {/* Prompt */}
          <Text style={styles.prompt}>{currentExercise.prompt}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentExercise.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedOption === option ? styles.selectedOption : null,
                ]}
                onPress={() => handleOptionSelect(option)}
                disabled={feedback !== null}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback */}
          {feedback && <Text style={styles.feedback}>{feedback}</Text>}
        </>
      ) : (
        <Text style={styles.errorText}>No exercises found. Please try again later.</Text>
      )}

      {/* SCORE DISPLAY */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 30,
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
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
  mediaContainer: {
    width: width * 0.8,
    height: 200,
    marginVertical: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  media: {
    width: width * 0.8,
    height: 200,
    resizeMode: "contain",
  },
  prompt: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
    alignItems: "center",
  },
  optionButton: {
    width: "80%",
    padding: 15,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  selectedOption: {
    backgroundColor: "#CBCBCB",
    borderColor: "#FFFFFF",
  },
  optionText: {
    fontSize: 18,
  },
  feedback: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    marginTop: 20,
  },
  scoreContainer: {
    position: "absolute",
    bottom: 20,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFD700",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 1,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
});