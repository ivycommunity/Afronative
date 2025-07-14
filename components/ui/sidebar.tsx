import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  
  const sidebarWidth = width * 0.4;
  const translateX = useRef(new Animated.Value(-sidebarWidth)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  // Always render the component but conditionally show/hide with opacity and pointerEvents
  return (
    <Pressable 
      style={[
        styles.overlay,
        { opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }
      ]} 
      onPress={toggleSidebar}
    >
      <Animated.View 
        style={[
          styles.sidebar, 
          { width: sidebarWidth, transform: [{ translateX }] }
        ]}
      >
        {/* Prevent clicks on sidebar from closing it */}
        <Pressable style={styles.sidebarContent} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
            <FontAwesome name="close" size={18} color="black" />
          </TouchableOpacity>

          {/* Menu Items */}
          <TouchableOpacity 
            onPress={() => {
              router.push("/home");
              toggleSidebar(); // Close sidebar after navigation
            }} 
            style={styles.menuItem}
          >
            <FontAwesome name="home" size={16} color="black" style={styles.icon} />
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              router.push("/practice");
              toggleSidebar();
            }} 
            style={styles.menuItem}
          >
            <FontAwesome name="question-circle" size={16} color="black" style={styles.icon} />
            <Text style={styles.menuText}>Practice</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              router.push("/home/quiz");  
              toggleSidebar();
            }} 
            style={styles.menuItem}
          >
            <FontAwesome name="gamepad" size={16} color="black" style={styles.icon} />
            <Text style={styles.menuText}>Quiz</Text>
          </TouchableOpacity>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    
    zIndex: 1000, // Ensure overlay is above other content
  },
  sidebar: {
    height: "25%", // Full height sidebar
    backgroundColor: "#fff",
    paddingTop: 60,
    position: "absolute",
    left: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 1001, // Ensure sidebar is above overlay
  },
  sidebarContent: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 1,
    right: 10,
    padding: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default Sidebar;