import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { BACKEND_BASE_URL, fetchWithTimeout } from '../apiClient';
import { getTimeAgo } from '../utils/dateHelpers';
import { colors, radius, spacing, typography } from '../theme';

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchNotifications(page = 1) {
  const res = await fetchWithTimeout(
    `${BACKEND_BASE_URL}/api/notifications?page=${page}&limit=20`
  );
  return res.json();
}

async function markRead(notificationId) {
  const res = await fetchWithTimeout(
    `${BACKEND_BASE_URL}/api/notifications/${notificationId}/read`,
    { method: 'PATCH' }
  );
  return res.json();
}

// ─── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({ item, onPress }) {
  return (
    <Pressable
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => onPress(item)}
      android_ripple={{ color: colors.border }}
    >
      {!item.read && <View style={styles.unreadDot} />}
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.itemBodyText} numberOfLines={3}>{item.body}</Text>
        <Text style={styles.itemTime}>{getTimeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

// ─── NotificationScreen ───────────────────────────────────────────────────────

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = useCallback(async (pageNum, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data = await fetchNotifications(pageNum);
      if (!data.success) throw new Error(data.message || 'Failed to load notifications.');
      if (pageNum === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      setHasMore(data.pagination?.hasMore ?? false);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const handleRefresh = useCallback(() => loadPage(1, true), [loadPage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    loadPage(page + 1);
  }, [hasMore, loadingMore, page, loadPage]);

  const handleItemPress = useCallback(async (item) => {
    // Mark as read optimistically in local state
    if (!item.read) {
      setNotifications(prev =>
        prev.map(n => n._id === item._id ? { ...n, read: true } : n)
      );
      // Best-effort server sync — non-blocking
      markRead(item._id).catch(() => {});
    }

    // Navigate to report details if a valid reportId is present.
    // Guards: null, empty string, and non-string values are all skipped.
    const reportId = item?.data?.reportId;
    if (reportId && typeof reportId === 'string' && reportId.trim()) {
      navigation.navigate('ReportDetail', { reportId: reportId.trim() });
    }
  }, [navigation]);

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handleItemPress} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyBody}>
                You'll see updates on rescues, assistance, and transfers here.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          contentContainerStyle={notifications.length === 0 ? styles.emptyFlex : styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  emptyFlex: {
    flexGrow: 1,
  },
  item: {
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemUnread: {
    backgroundColor: colors.primarySoft,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  itemBodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  itemTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.heading,
    fontSize: 18,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    ...typography.meta,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    ...typography.body,
    color: colors.critical,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
