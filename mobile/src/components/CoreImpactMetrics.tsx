import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../lib/firebase/config';
import { useTheme } from '../lib/ThemeProvider';
import { typography, spacing, borderRadius, elevation } from '../lib/theme';

export default function CoreImpactMetrics() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [totalTrays, setTotalTrays] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [foodTypeCounts, setFoodTypeCounts] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const eventsRef = collection(firestore, 'Events');
    const closedEventsQuery = query(eventsRef, where('status', '==', 'closed'));

    const unsubscribe = onSnapshot(
      closedEventsQuery,
      (snapshot) => {
        let trays = 0;
        let eventCounter = 0;
        const foodTypeMap: Record<string, number> = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          eventCounter++;

          if (Array.isArray(data.foods)) {
            for (const food of data.foods) {
              const qtyValue = food.quantity ?? food.Qty ?? food.qty;
              const numericQty =
                typeof qtyValue === 'number'
                  ? qtyValue
                  : parseFloat(String(qtyValue).replace(/[^0-9.]/g, ''));

              if (!isNaN(numericQty)) {
                trays += numericQty;
              }

              const itemName = (food.item ?? food.name ?? 'Unknown').trim();
              if (itemName) {
                foodTypeMap[itemName] = (foodTypeMap[itemName] || 0) + 1;
              }
            }
          }
        });

        setTotalTrays(trays);
        setEventCount(eventCounter);
        setFoodTypeCounts(foodTypeMap);
        setLoading(false);

        if (__DEV__) console.log(`📊 ${eventCounter} closed events processed`);
      },
      (error) => {
        console.error('Error fetching metrics:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const avgTrays =
    eventCount > 0 ? (totalTrays / eventCount).toFixed(1) : '0.0';
  const estimatedMeals = totalTrays * 8;
  const foodTypeArray = Object.entries(foodTypeCounts).sort(
    (a, b) => b[1] - a[1],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        metricGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xl,
        },
        metricCard: {
          width: '48%',
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.xl,
          alignItems: 'center',
          marginBottom: spacing.lg,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: elevation.md },
          shadowRadius: elevation.lg,
        },
        metricTitle: {
          ...typography.bodySmall,
          color: colors.text.secondary,
          marginBottom: spacing.xs,
        },
        metricValue: {
          ...typography.h3,
          color: colors.primary,
          fontWeight: 'bold',
        },
        section: {
          paddingHorizontal: spacing.lg,
        },
        sectionTitle: {
          ...typography.h5,
          color: colors.text.primary,
          marginBottom: spacing.md,
        },
        foodRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        },
        foodName: {
          ...typography.body,
          color: colors.text.primary,
        },
        foodCount: {
          ...typography.body,
          color: colors.text.secondary,
        },
        emptyText: {
          ...typography.bodySmall,
          color: colors.text.secondary,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Metric Cards */}
      <View style={styles.metricGrid}>
        <MetricCard
          title="Total Trays Saved"
          value={totalTrays}
          styles={styles}
        />
        <MetricCard
          title="Total Events Hosted"
          value={eventCount}
          styles={styles}
        />
        <MetricCard
          title="Avg Trays per Event"
          value={avgTrays}
          styles={styles}
        />
        <MetricCard
          title="Estimated Meals Served"
          value={estimatedMeals}
          styles={styles}
        />
      </View>

      {/* Food Type Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Common Food Types</Text>
        {foodTypeArray.length === 0 ? (
          <Text style={styles.emptyText}>No closed events yet</Text>
        ) : (
          <FlatList
            data={foodTypeArray}
            keyExtractor={(item) => item[0]}
            renderItem={({ item }) => (
              <View style={styles.foodRow}>
                <Text style={styles.foodName}>{item[0]}</Text>
                <Text style={styles.foodCount}>{item[1]}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

/* ========== Subcomponents ========== */
function MetricCard({
  title,
  value,
  styles,
}: {
  title: string;
  value: string | number;
  styles: any;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}
