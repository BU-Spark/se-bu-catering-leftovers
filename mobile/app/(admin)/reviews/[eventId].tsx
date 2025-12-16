import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { firestore } from '../../../src/lib/firebase/config';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../../src/lib/theme';

interface Review {
  id?: string;
  comment: string;
  date: any;
  images?: string[];
  name?: string;
  email?: string;
  shareContact?: boolean;
  rating?: number;
}

const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fillPercentage = Math.min(Math.max(rating - (i - 1), 0), 1);
    stars.push(
      <View key={i} style={styles.starContainer}>
        <Text style={styles.starEmpty}>★</Text>
        <View
          style={[
            styles.starFillContainer,
            { width: `${fillPercentage * 100}%` },
          ]}
        >
          <Text style={styles.starFilled}>★</Text>
        </View>
      </View>,
    );
  }
  return <View style={styles.starsRow}>{stars}</View>;
};

export default function AdminEventReviewsPage() {
  const { eventId, eventName } = useLocalSearchParams<{
    eventId: string;
    eventName?: string;
  }>();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  const fetchReviews = useCallback(async () => {
    if (!eventId) return;
    try {
      const reviewsRef = collection(firestore, 'Reviews', eventId, 'Reviews');
      const q = query(reviewsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      setReviews(list);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = onSnapshot(
      collection(firestore, 'Reviews', eventId, 'Reviews'),
      () => fetchReviews(),
    );
    return () => unsub();
  }, [eventId, fetchReviews]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Feedback</Text>
          </View>
          {eventName && (
            <Text style={styles.eventName} numberOfLines={1}>
              {eventName}
            </Text>
          )}
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.headerSubtitle}>
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </Text>
            {reviews.length > 0 && (
              <>
                <Text style={styles.headerDot}>•</Text>
                <View style={styles.headerRatingContainer}>
                  <Text style={styles.headerRatingText}>
                    {averageRating.toFixed(1)}
                  </Text>
                  <StarRating rating={averageRating} />
                </View>
              </>
            )}
          </View>
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
                    {review.shareContact && review.email
                      ? review.email.charAt(0).toUpperCase()
                      : '?'}
                  </Text>
                </View>
                <View style={styles.reviewHeaderText}>
                  {review.shareContact ? (
                    <>
                      {review.name && (
                        <Text style={styles.reviewerName}>{review.name}</Text>
                      )}
                      <Text style={styles.reviewerEmail}>{review.email}</Text>
                    </>
                  ) : (
                    <Text style={styles.reviewerName}>Anonymous</Text>
                  )}
                </View>
                <Text style={styles.timeAgo}>{formatDate(review.date)}</Text>
              </View>

              {/* Comment */}
              {review.comment ? (
                <Text style={styles.comment}>{review.comment}</Text>
              ) : (
                <Text style={styles.noComment}>(No written feedback)</Text>
              )}

              {/* Rating */}
              {review.rating !== undefined && (
                <View style={styles.reviewRatingContainer}>
                  <StarRating rating={review.rating} />
                  <Text style={styles.reviewRatingText}>
                    {review.rating.toFixed(1)}
                  </Text>
                </View>
              )}

              {/* Uploaded Images */}
              {review.images && review.images.length > 0 ? (
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
              ) : (
                <Text style={styles.noPhotos}>(No photos submitted)</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  eventName: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerDot: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginHorizontal: spacing.xs,
  },
  headerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRatingText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyState: {
    alignItems: 'center',
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
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.body,
    color: colors.text.onPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewerName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
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
    marginBottom: spacing.sm,
  },
  noComment: {
    ...typography.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  reviewRatingText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starContainer: {
    position: 'relative',
    width: 16,
    height: 16,
  },
  starEmpty: {
    fontSize: 16,
    color: colors.border.light,
    position: 'absolute',
  },
  starFillContainer: {
    overflow: 'hidden',
    position: 'absolute',
    height: 16,
  },
  starFilled: {
    fontSize: 16,
    color: '#FFB800',
  },
  noPhotos: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
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
