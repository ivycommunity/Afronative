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
import { Audio, AVPlaybackStatus } from "expo-av";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import client from "../../firebase/storage/contentfulClient";

const { width } = Dimensions.get("window");

type Exercise = {
  id: string;
  type: string;
  lesson: string;
  prompt: string;
  correct_answer: string;
  options: string[];
  media?: string;
};

export default function ListeningPractice() {
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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Listening Exercises from Contentful
  useEffect(() => {
    const fetchListeningExercises = async () => {
      setLoading(true);
      try {
        const response = await client.getEntries({
          content_type: "kiswahiliExerciseCollection",
          "fields.typeOfExercise": "Listening",
        });

        // Log minimal information for debugging
        if (response.items.length > 0) {
          console.log(
            "Fetched listening exercises count:",
            response.items.length,
            "| First Exercise ID:",
            response.items[0].sys.id
          );
        } else {
          console.log("No listening exercises found in Contentful.");
        }

        const fetchedExercises: Exercise[] = response.items.map((item: any) => {
          let mediaUrl = "";

          // Check if videosimagesaudio exists in fields
          if (item.fields.videosimagesaudio) {
            // Handle array of assets
            if (Array.isArray(item.fields.videosimagesaudio) && 
                item.fields.videosimagesaudio.length > 0) {
              const mediaItem = item.fields.videosimagesaudio[0];
              
              // Check if it's a properly structured asset
              if (mediaItem && mediaItem.sys && mediaItem.sys.id) {
                // For linked assets, we need to find the actual asset in response.includes
                if (response.includes && response.includes.Asset) {
                  const asset = response.includes.Asset.find(
                    (asset: any) => asset.sys.id === mediaItem.sys.id
                  );
                  
                  if (asset && asset.fields && asset.fields.file) {
                    const fileUrl = asset.fields.file.url;
                    mediaUrl = fileUrl.startsWith("http") ? fileUrl : `https:${fileUrl}`;
                  }
                }
              }
            }
          }

          console.log(`Exercise ${item.sys.id} media URL:`, mediaUrl);

          return {
            id: item.sys.id,
            type: "Listening",
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
        console.error("Error fetching listening exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListeningExercises();
  }, []);

  // Fetch User Profile
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

  // Audio playback status update handler
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      
      // When audio finishes playing, reset isPlaying state
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  // Toggle audio play/pause
  const toggleAudio = async () => {
    if (!currentExercise || !currentExercise.media) return;

    try {
      if (sound) {
        // If sound exists, toggle play/pause
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        // Create and play the sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentExercise.media },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error handling audio:", error);
    }
  };

  // Reset audio when moving to a new question
  useEffect(() => {
    const resetAudio = async () => {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    };
    
    resetAudio();
  }, [currentQuestionIndex]);

  // Cleanup Audio
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Handle Answer Selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (option === currentExercise?.correct_answer) {
      setFeedback("Correct! ✅");
      setScore((prevScore) => prevScore + 10);
    } else {
      setFeedback("Incorrect ❌");
    }

    // Move to the next question after 3 seconds
    setTimeout(() => {
      if (currentQuestionIndex < exercises.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        router.push("/practice"); // Go back after last question
      }
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.push("/practice")}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>
            Hello {userProfile?.username || "User"}
          </Text>
          <Text style={styles.subText}>Let's Practice!</Text>

          {/* Streak Count */}
          <View style={styles.streakWrapper}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{userProfile?.streakCount ?? 0}</Text>
          </View>
        </View>

        {/* Profile Picture */}
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
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : currentExercise ? (
        <>
          {/* Enhanced Audio Player Button */}
          <TouchableOpacity style={styles.audioButton} onPress={toggleAudio}>
            {isPlaying ? (
              <Ionicons name="pause" size={28} color="white" />
            ) : (
              <Ionicons name="play" size={28} color="white" />
            )}
            <Text style={styles.audioText}>
              {isPlaying ? "Pause Audio" : "Play Audio"}
            </Text>
            <View style={styles.audioIconContainer}>
              <AntDesign name="sound" size={24} color="white" />
            </View>
          </TouchableOpacity>

          {/* Question Prompt */}
          <Text style={styles.prompt}>{currentExercise.prompt}</Text>

          {/* OPTIONS */}
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

          {/* Feedback Message */}
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

/* Enhanced Styles */
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
  audioButton: {
    flexDirection: "row",
    backgroundColor: "#4361EE",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: "center",
    width: "80%",
  },
  audioText: {
    color: "white",
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  audioIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 6,
  },
  optionsContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  optionButton: {
    width: "80%",
    padding: 15,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedOption: {
    backgroundColor: "#CBCBCB",
    borderColor: "#FFFFFF",
  },
  optionText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    marginTop: 20,
  },
  feedback: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
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
  prompt: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreContainer: {
    position: "absolute",
    bottom: 20,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFD700",
    padding: 15,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
});