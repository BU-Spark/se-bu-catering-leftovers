import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../lib/firebase/config';
import { colors, typography, spacing, borderRadius, elevation } from '../lib/theme';

export default function TotalTraysSaved() {
    const [totalTrays, setTotalTrays] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const eventsRef = collection(firestore, 'Events');

        // Real-time subscription for live metric updates
        const unsubscribe = onSnapshot(
            eventsRef,
            (snapshot) => {
                let total = 0;
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log('Event ID:', doc.id, 'Data:', JSON.stringify(data, null, 2));
                    if (data.status === 'closed' && Array.isArray(data.foods)) {
                        for (const food of data.foods) {
                            const qtyValue = food.quantity ?? food.Qty ?? food.qty;
                            const numericQty =
                                typeof qtyValue === 'number'
                                    ? qtyValue
                                    : parseFloat(String(qtyValue).replace(/[^0-9.]/g, ''));

                            if (!isNaN(numericQty)) {
                                total += numericQty;
                            }
                        }
                    }

                });
                setTotalTrays(total);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching trays:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <View style={styles.metricCard}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Total Trays Saved</Text>
            <Text style={styles.metricValue}>{totalTrays ?? 0}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    metricCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: elevation.md },
        shadowRadius: elevation.lg,
        marginBottom: spacing.xl,
    },
    metricTitle: {
        ...typography.body,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    metricValue: {
        ...typography.h2,
        color: colors.primary,
        fontWeight: 'bold',
    },
});
