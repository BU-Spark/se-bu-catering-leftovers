import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "../../../src/lib/firebase/config";
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from "../../../src/lib/theme";

interface Review {
  id?: string;
  comment: string;
  date: any;
  images?: string[];
  name?: string;
  email?: string;
  shareContact?: boolean;
}

export default function AdminEventReviewsPage() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!eventId) return;
    try {
      const reviewsRef = collection(firestore, "Reviews", eventId, "Reviews");
      const q = query(reviewsRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      setReviews(list);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = onSnapshot(
      collection(firestore, "Reviews", eventId, "Reviews"),
      () => fetchReviews()
    );
    return () => unsub();
  }, [eventId, fetchReviews]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Feedback</Text>
          <Text style={styles.headerSubtitle}>
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No feedback yet</Text>
            <Text style={styles.emptyText}>
              Reviews will appear here once students share their feedback
            </Text>
          </View>
        ) : (
          reviews.map((review, index) => (
            <View key={review.id || index} style={styles.reviewCard}>
              {/* Header with user info and date */}
              <View style={styles.reviewHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {review.name ? review.name.charAt(0).toUpperCase() : "?"}
                  </Text>
                </View>
                <View style={styles.reviewHeaderText}>
                  {review.shareContact ? (
                    <>
                      <Text style={styles.reviewerName}>{review.name}</Text>
                      <Text style={styles.reviewerEmail}>{review.email}</Text>
                    </>
                  ) : (
                    <Text style={styles.reviewerName}>Anonymous</Text>
                  )}
                </View>
                <Text style={styles.timeAgo}>{formatDate(review.date)}</Text>
              </View>

              {/* Comment */}
              <Text style={styles.comment}>{review.comment}</Text>

              {/* Uploaded Images */}
              {review.images && review.images.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                  contentContainerStyle={styles.imageScrollContent}
                >
                  {review.images.map((url, i) => (
                    <Image 
                      key={i} 
                      source={{ uri: url }} 
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: "600",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: "700",
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 3,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl * 3,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.body,
    color: colors.text.onPrimary,
    fontWeight: "700",
    fontSize: 18,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewerName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: "600",
  },
  reviewerEmail: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  comment: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  imageScroll: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  imageScrollContent: {
    paddingRight: spacing.lg,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.border.light,
  },
});