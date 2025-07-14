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
import { Audio } from "expo-av";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import client from "../../firebase/storage/contentfulClient";

const { width } = Dimensions.get("window");

// Define Exercise Type
type Exercise = {
  id: string;
  type: string;
  lesson: string;
  prompt: string;
  correct_answer: string;
  media?: string;
};

export default function SpeakingPractice() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    username: string;
    photoURL?: string;
    streakCount?: number;
  } | null>(null);

  const [exercises, setExercises] = useState<Exercise[]>([]); // Store fetched exercises
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [loading, setLoading] = useState(true); // Add loading state

  const currentExercise = exercises[currentQuestionIndex];

  // Fetch Speaking Exercises from Contentful
  useEffect(() => {
    const fetchSpeakingExercises = async () => {
      setLoading(true);
      try {
        const response = await client.getEntries({
          content_type: "kiswahiliExerciseCollection",
          "fields.typeOfExercise": "Speaking", // Filter by Speaking type
        });

        // Log minimal information for debugging
        if (response.items.length > 0) {
          console.log(
            "Fetched speaking exercises count:",
            response.items.length,
            "| First Exercise ID:",
            response.items[0].sys.id
          );
        } else {
          console.log("No speaking exercises found in Contentful.");
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
            type: String(item.fields.typeOfExercise || "Speaking"),
            lesson: String(item.fields.lessonTitle || "Unknown Lesson"),
            prompt: String(item.fields.questionprompt || "No prompt available"),
            correct_answer: String(item.fields.correctAnswer || ""),
            media: mediaUrl,
          };
        });

        setExercises(fetchedExercises);
      } catch (error) {
        console.error("Error fetching speaking exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeakingExercises();
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

  // Play/Pause Audio Function
  const togglePlayAudio = async () => {
    if (!currentExercise || !currentExercise.media) return;

    try {
      if (sound && isPlaying) {
        // Pause the sound
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        // Resume the sound
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // First time playing this sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentExercise.media },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Monitor sound playback
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };

  // Cleanup Audio
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!isRecording) {
      setRecordingDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Start Recording
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert("You need to grant audio permissions.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop Recording
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  // Play Recorded Audio
  const playRecording = async () => {
    if (!recordedUri) return;

    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing recording:", error);
    }
  };

  // Check if the User's Recording is Correct
  const checkAnswer = () => {
    if (!recordedUri) return;
    if (currentExercise?.correct_answer) {
      setFeedback("Correct! ✅");
      setScore((prevScore) => prevScore + 10);
    } else {
      setFeedback("Incorrect ❌");
    }

    // Move to the next question after 3 seconds
    setTimeout(() => {
      if (currentQuestionIndex < exercises.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setFeedback(null);
        setRecordedUri(null); // Reset recorded audio
        if (sound) {
          sound.unloadAsync();
          setSound(null);
        }
        setIsPlaying(false);
      } else {
        router.push("/practice"); // Go back after last question
      }
    }, 3000);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format milliseconds for progress display
  const formatMilliseconds = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    return formatTime(totalSeconds);
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

      {/* LOADING STATE */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : currentExercise ? (
        <>
          {/* Prompt */}
          <Text style={styles.prompt}>{currentExercise.prompt}</Text>

          {/* PLAY AUDIO BUTTON */}
          {currentExercise.media && (
            <View style={styles.audioSection}>
              <TouchableOpacity 
                style={styles.audioButton} 
                onPress={togglePlayAudio}
              >
                {isPlaying ? (
                  <Ionicons name="pause" size={28} color="white" />
                ) : (
                  <Ionicons name="play" size={28} color="white" />
                )}
                <Text style={styles.audioText}>
                  {isPlaying ? "Pause Audio" : "Play Audio"}
                </Text>
              </TouchableOpacity>
              
              {/* Audio progress bar */}
              {playbackDuration > 0 && (
                <View style={styles.audioProgressContainer}>
                  <View style={styles.audioProgressBarContainer}>
                    <View 
                      style={[
                        styles.audioProgressBar,
                        { width: `${(playbackPosition / playbackDuration) * 100}%` }
                      ]}
                    />
                  </View>
                  <View style={styles.audioTimestamps}>
                    <Text style={styles.timestampText}>
                      {formatMilliseconds(playbackPosition)}
                    </Text>
                    <Text style={styles.timestampText}>
                      {formatMilliseconds(playbackDuration)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* RECORDING CONTROLS */}
          <View style={styles.recordingSection}>
            <Text style={styles.sectionTitle}>Your Response</Text>
            
            {/* Recording state indicators */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Recording... {formatTime(recordingDuration)}
                </Text>
              </View>
            )}
            
            {/* Recording controls */}
            <View style={styles.controlsContainer}>
              {!isRecording && !recordedUri && (
                <TouchableOpacity 
                  onPress={startRecording} 
                  style={styles.controlButton}
                >
                  <Ionicons name="mic" size={28} color="white" />
                  <Text style={styles.controlText}>Start Recording</Text>
                </TouchableOpacity>
              )}
              
              {isRecording && (
                <TouchableOpacity 
                  onPress={stopRecording} 
                  style={[styles.controlButton, styles.stopButton]}
                >
                  <Ionicons name="stop-circle" size={28} color="white" />
                  <Text style={styles.controlText}>Stop Recording</Text>
                </TouchableOpacity>
              )}
              
              {recordedUri && (
                <>
                  <TouchableOpacity 
                    onPress={playRecording} 
                    style={styles.controlButton}
                  >
                    {sound && isPlaying ? (
                      <Ionicons name="pause" size={28} color="white" />
                    ) : (
                      <Ionicons name="play" size={28} color="white" />
                    )}
                    <Text style={styles.controlText}>
                      {sound && isPlaying ? "Pause" : "Play Recording"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      setRecordedUri(null);
                      if (sound) {
                        sound.unloadAsync();
                        setSound(null);
                      }
                    }} 
                    style={[styles.controlButton, styles.retryButton]}
                  >
                    <AntDesign name="reload1" size={28} color="white" />
                    <Text style={styles.controlText}>Record Again</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* CHECK ANSWER BUTTON */}
          {recordedUri && (
            <TouchableOpacity 
              onPress={checkAnswer} 
              style={styles.submitButton}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>Check Answer</Text>
              <AntDesign name="checkcircle" size={22} color="white" style={styles.submitIcon} />
            </TouchableOpacity>
          )}

          {/* Feedback Message */}
          {feedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.errorText}>No exercises found.</Text>
      )}

      {/* SCORE DISPLAY */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>
    </SafeAreaView>
  );
}

/* ✅ Enhanced Styles */
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      padding: 20,
      alignItems: "center",
    },
    headerContainer: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 40,
      marginBottom: 20,
    },
    backButton: {
      padding: 10,
      backgroundColor: "#F3F4F6",
      borderRadius: 12,
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
      borderWidth: 2,
      borderColor: "#3B82F6",
    },
    progressContainer: {
      width: "100%",
      marginBottom: 15,
    },
    progressText: {
      fontSize: 14,
      color: "#4B5563",
      marginBottom: 5,
    },
    progressBarContainer: {
      width: "100%",
      height: 8,
      backgroundColor: "#E5E7EB",
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#3B82F6",
      borderRadius: 4,
    },
    exerciseContainer: {
      width: "100%",
      alignItems: "center",
      flex: 1,
      paddingBottom: 80,
    },
    prompt: {
      fontSize: 22,
      fontWeight: "bold",
      marginVertical: 20,
      textAlign: "center",
      color: "#111827",
      lineHeight: 30,
    },
    audioSection: {
      width: "100%",
      alignItems: "center",
      marginBottom: 20,
    },
    audioButton: {
      flexDirection: "row",
      backgroundColor: "#3B82F6",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      width: "80%",
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
    audioProgressContainer: {
      width: "80%",
      marginTop: 15,
    },
    audioProgressBarContainer: {
      width: "100%",
      height: 6,
      backgroundColor: "#E5E7EB",
      borderRadius: 3,
      overflow: "hidden",
    },
    audioProgressBar: {
      height: "100%",
      backgroundColor: "#3B82F6",
      borderRadius: 3,
    },
    audioTimestamps: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 5,
    },
    timestampText: {
      fontSize: 12,
      color: "#6B7280",
    },
    recordingSection: {
      width: "100%",
      alignItems: "center",
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#111827",
      marginBottom: 15,
      alignSelf: "flex-start",
      marginLeft: "10%",
    },
    recordingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FEE2E2",
      padding: 10,
      borderRadius: 8,
      marginBottom: 15,
    },
    recordingDot: {
      width: 12,
      height: 12,
      backgroundColor: "#EF4444",
      borderRadius: 6,
      marginRight: 8,
      // Pulsing animation would be implemented with Animated API
    },
    recordingText: {
      color: "#B91C1C",
      fontWeight: "500",
    },
    controlsContainer: {
      width: "100%",
      alignItems: "center",
      gap: 10,
    },
    controlButton: {
      flexDirection: "row",
      backgroundColor: "#4F46E5",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      width: "80%",
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    stopButton: {
      backgroundColor: "#EF4444",
    },
    retryButton: {
      backgroundColor: "#9CA3AF",
    },
    controlText: {
      color: "white",
      marginLeft: 10,
      fontSize: 16,
      fontWeight: "600",
    },
    submitButton: {
      flexDirection: "row",
      backgroundColor: "#22C55E",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      width: "80%",
      marginTop: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 4,
    },
    submitButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
    },
    submitIcon: {
      marginLeft: 8,
    },
    feedbackContainer: {
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      backgroundColor: "#F3F4F6",
      width: "80%",
      alignItems: "center",
    },
    feedbackText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#111827",
    },
    errorText: {
      fontSize: 18,
      color: "#EF4444",
      marginTop: 40,
    },
    scoreContainer: {
      position: "absolute",
      bottom: 20,
      width: "90%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#FFD700",
      padding: 16,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    scoreText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#111827",
    },
    scoreValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#111827",
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
  });