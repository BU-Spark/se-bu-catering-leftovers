import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { addDoc, collection, updateDoc, doc, arrayUnion, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { firestore, storage } from "../../src/lib/firebase/config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "@clerk/clerk-expo";
import { colors, typography, spacing, borderRadius } from "../../src/lib/theme";
import { useEffect, useState } from "react";
import BUlogo from "../../assets/boston-university-logo.png";
import { Ionicons } from "@expo/vector-icons";



export default function FeedbackPage() {
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const { user } = useUser();

    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [eventName, setEventName] = useState("Loading...");

    useEffect(() => {
        const fetchEventName = async () => {
            if (!eventId) return;
            try {
                const docRef = doc(firestore, "Events", eventId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEventName(data.name || "Unnamed Event");
                } else {
                    setEventName("Unknown Event");
                }
            } catch (error) {
                console.error("Error fetching event name:", error);
                setEventName("Error loading event");
            }
        };

        fetchEventName();
    }, [eventId]);

    // ⭐ Handle rating stars
    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Pressable key={i} onPress={() => setRating(i)}>
                    <Text style={[styles.star, i <= rating ? styles.starSelected : {}]}>★</Text>
                </Pressable>
            );
        }
        return stars;
    };

    // 🖼️ Upload image
    const handleUploadPhoto = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.status !== "granted") {
                Alert.alert("Permission required", "We need photo access to upload an image.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setUploading(true);

            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const fileName = `feedback_${eventId}_${Date.now()}.jpg`;
            const storageRef = ref(storage, `feedback/${fileName}`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            setUploadedImage(downloadURL);
            setUploading(false);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to upload image.");
            setUploading(false);
        }
    };

    // 📨 Submit feedback
    const handleSubmit = async () => {
        if (!comment.trim() || rating === 0) {
            Alert.alert("Incomplete", "Please provide both a rating and feedback.");
            return;
        }

        try {
            const feedbackRef = collection(firestore, "Reviews", eventId, "Reviews");
            const docRef = await addDoc(feedbackRef, {
                rating,
                comment: comment.trim(),
                images: uploadedImage ? [uploadedImage] : [],
                date: serverTimestamp(),
                name: user?.fullName || "",
                email: user?.primaryEmailAddress?.emailAddress || "",
            });
            await updateDoc(docRef, { id: docRef.id });

            await setDoc(
                doc(firestore, "Users", user?.id || ""),
                { reviews: arrayUnion(eventId) },
                { merge: true }
            );

            await updateDoc(doc(firestore, "Events", eventId), {
                reviewedBy: arrayUnion(user?.id),
            });

            Alert.alert("Thank you!", "Your feedback has been submitted.");
            router.back();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to submit feedback.");
        }

    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
            {/* Back Button*/}
            <Pressable style={styles.backIcon} onPress={() => router.back()}>
                <Text style={styles.backIconText}>←</Text>
            </Pressable>


            {/* BU Logo */}
            <View style={styles.logoContainer}>
                <Image source={BUlogo} style={styles.logoImage} resizeMode="contain" />
            </View>




            {/* Dropdown*/}
            <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>{eventName}</Text>
            </View>


            {/* Upload Photo */}
            <Pressable style={styles.uploadBox} onPress={handleUploadPhoto}>
                {uploadedImage ? (
                    <Image source={{ uri: uploadedImage }} style={styles.uploadPreview} />
                ) : (
                    <>
                        <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} style={{ marginBottom: spacing.sm }} />
                        <Text style={styles.uploadText}>
                            {uploading ? "Uploading..." : "Upload Photo"}
                        </Text>
                    </>
                )}
            </Pressable>


            {/* Rating */}
            <Text style={styles.ratingLabel}>How would you rate the food?</Text>
            <View style={styles.starContainer}>{renderStars()}</View>

            {/* Feedback */}
            <Text style={styles.feedbackLabel}>Feedback</Text>
            <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                value={comment}
                onChangeText={setComment}
                placeholder="Tell us what you think..."
                placeholderTextColor={colors.text.secondary}
            />

            {/* Submit Button */}
            <Pressable style={styles.sendButton} onPress={handleSubmit}>
                <Text style={styles.sendText}>Send</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        flex: 1,
    },
    backIcon: {
        position: "absolute",
        top: 60, // adjust for iOS safe area
        left: 20,
        zIndex: 10,
    },
    backIconText: {
        fontSize: 28,
        color: colors.secondary,
        fontWeight: "400",
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: spacing.xl,
        marginTop: spacing.xxl + 20,
    },

    logoImage: {
        width: 220,
        height: 60,
        resizeMode: "contain",
    },
    dropdown: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    dropdownText: {
        color: colors.secondary,
        ...typography.body,
    },
    uploadBox: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: borderRadius.sm,
        height: 140,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    uploadText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: "600",
    },
    uploadPreview: {
        width: "100%",
        height: "100%",
        borderRadius: borderRadius.sm,
        resizeMode: "cover",
    },
    ratingLabel: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: "600",
        marginBottom: spacing.sm,
    },
    starContainer: {
        flexDirection: "row",
        marginBottom: spacing.lg,
    },
    star: {
        fontSize: 32,
        color: colors.border.default,
        marginRight: spacing.sm,
    },
    starSelected: {
        color: colors.primary,
    },
    feedbackLabel: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: "600",
        marginBottom: spacing.xs,
    },
    textArea: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface,
        padding: spacing.md,
        minHeight: 100,
        marginBottom: spacing.xl,
        ...typography.body,
        color: colors.text.primary,
    },
    sendButton: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.md,
        width: 100,
        alignSelf: "center",
    },
    sendText: {
        color: colors.text.onPrimary,
        ...typography.body,
        fontWeight: "600",
    },
});
