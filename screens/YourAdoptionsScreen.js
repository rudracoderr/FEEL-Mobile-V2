import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MapPin, X } from 'lucide-react-native';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { colors, radius, spacing, typography } from '../theme';
import { BACKEND_BASE_URL, fetchWithTimeout } from '../apiClient';
import { auth } from '../firebase';

export default function YourAdoptionsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'applications'
  const [listings, setListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // For owner managing applicants
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingApplicants, setListingApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!auth.currentUser) return;
    try {
      if (!isRefresh) setLoading(true);
      
      const [listingsRes, appsRes] = await Promise.all([
        fetchWithTimeout(`${BACKEND_BASE_URL}/api/adoptions/my-listings`),
        fetchWithTimeout(`${BACKEND_BASE_URL}/api/adoptions/my-applications`)
      ]);
      
      if (listingsRes.ok) {
        const lData = await listingsRes.json();
        if (lData.success) setListings(lData.adoptionListings);
      }
      
      if (appsRes.ok) {
        const aData = await appsRes.json();
        if (aData.success) setApplications(aData.applications);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const openApplicantsModal = async (listing) => {
    setSelectedListing(listing);
    setLoadingApplicants(true);
    try {
      const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/adoptions/${listing._id}/applications`);
      const data = await res.json();
      if (res.ok && data.success) {
        setListingApplicants(data.applications);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleApprove = async (appId) => {
    try {
      const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/adoptions/applications/${appId}/approve`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Success', 'Application approved! The listing is now marked as adopted.');
        setSelectedListing(null);
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to approve');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  const handleReject = async (appId) => {
    try {
      const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/adoptions/applications/${appId}/reject`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Success', 'Application rejected.');
        // Remove from list locally
        setListingApplicants(prev => prev.map(a => a._id === appId ? { ...a, status: 'rejected' } : a));
      } else {
        Alert.alert('Error', data.message || 'Failed to reject');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  const handleCancelApplication = async (appId) => {
    Alert.alert('Cancel Application', 'Are you sure you want to cancel this application?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        try {
          const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/adoptions/applications/${appId}/cancel`, { method: 'PATCH' });
          const data = await res.json();
          if (res.ok && data.success) {
            fetchData();
          } else {
            Alert.alert('Error', data.message || 'Failed to cancel');
          }
        } catch (error) {
          Alert.alert('Error', 'Network error');
        }
      } }
    ]);
  };

  const renderListingCard = ({ item }) => {
    const photoUrl = item.photos && item.photos.length > 0 ? item.photos[0] : null;
    return (
      <View style={styles.card}>
        {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.cardImage} /> : <View style={styles.cardImagePlaceholder}><Text style={styles.placeholderText}>No Photo</Text></View>}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.animalName}</Text>
          <Text style={styles.cardSubtitle}>Status: {item.status}</Text>
          <Button label="View Applications" onPress={() => openApplicantsModal(item)} variant="outline" style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  };

  const renderApplicationCard = ({ item }) => {
    const listing = item.listingId || {};
    const photoUrl = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;
    return (
      <View style={styles.card}>
        {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.cardImage} /> : <View style={styles.cardImagePlaceholder}><Text style={styles.placeholderText}>No Photo</Text></View>}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{listing.animalName || 'Unknown Pet'}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, item.status === 'approved' ? {backgroundColor: colors.success + '20'} : item.status === 'rejected' ? {backgroundColor: colors.danger + '20'} : {}]}>
              <Text style={[styles.badgeText, item.status === 'approved' ? {color: colors.success} : item.status === 'rejected' ? {color: colors.danger} : {}]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          {item.status === 'pending' && (
            <Button label="Cancel Application" onPress={() => handleCancelApplication(item._id)} variant="danger" style={{ marginTop: spacing.sm }} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Button>
        <Text style={styles.headerTitle}>Your Adoptions</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'listings' && styles.activeTab]} onPress={() => setActiveTab('listings')}>
          <Text style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>My Listings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'applications' && styles.activeTab]} onPress={() => setActiveTab('applications')}>
          <Text style={[styles.tabText, activeTab === 'applications' && styles.activeTabText]}>My Applications</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}><LoadingState message="Loading..." /></View>
      ) : activeTab === 'listings' ? (
        listings.length === 0 ? (
          <View style={styles.centerContainer}><EmptyState title="No Listings" message="You haven't created any adoption listings." /></View>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item._id}
            renderItem={renderListingCard}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )
      ) : (
        applications.length === 0 ? (
          <View style={styles.centerContainer}><EmptyState title="No Applications" message="You haven't submitted any applications." /></View>
        ) : (
          <FlatList
            data={applications}
            keyExtractor={(item) => item._id}
            renderItem={renderApplicationCard}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )
      )}

      {/* Applicants Modal */}
      <Modal visible={Boolean(selectedListing)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Applicants for {selectedListing?.animalName}</Text>
              <TouchableOpacity onPress={() => setSelectedListing(null)} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {loadingApplicants ? (
                <LoadingState message="Loading applicants..." />
              ) : listingApplicants.length === 0 ? (
                <EmptyState title="No Applicants" message="No one has applied yet." />
              ) : (
                listingApplicants.map(app => (
                  <View key={app._id} style={styles.applicantCard}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, app.status === 'approved' ? {backgroundColor: colors.success + '20'} : app.status === 'rejected' ? {backgroundColor: colors.danger + '20'} : {}]}>
                        <Text style={[styles.badgeText, app.status === 'approved' ? {color: colors.success} : app.status === 'rejected' ? {color: colors.danger} : {}]}>
                          {app.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.applicantLabel}>Reason:</Text>
                    <Text style={styles.applicantText}>{app.formAnswers?.reason}</Text>
                    <Text style={styles.applicantLabel}>Experience:</Text>
                    <Text style={styles.applicantText}>{app.formAnswers?.experience}</Text>
                    <Text style={styles.applicantLabel}>Living Situation:</Text>
                    <Text style={styles.applicantText}>{app.formAnswers?.livingSituation}</Text>
                    <Text style={styles.applicantLabel}>Phone:</Text>
                    <Text style={styles.applicantText}>{app.formAnswers?.phone}</Text>
                    
                    {app.status === 'pending' && selectedListing?.status !== 'adopted' && (
                      <View style={styles.actionRow}>
                        <Button label="Reject" variant="outline" onPress={() => handleReject(app._id)} style={{ flex: 1, marginRight: spacing.sm }} />
                        <Button label="Approve" onPress={() => handleApprove(app._id)} style={{ flex: 1 }} />
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backButton: { width: 44, height: 44, borderRadius: radius.round, paddingHorizontal: 0, borderColor: colors.border },
  headerTitle: { ...typography.heading, fontSize: 18 },
  headerPlaceholder: { width: 44 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.body, color: colors.textSecondary },
  activeTabText: { color: colors.primary, fontWeight: '700' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  cardImage: { width: '100%', height: 150, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 150, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: colors.textSecondary },
  cardContent: { padding: spacing.md },
  cardTitle: { ...typography.heading, fontSize: 18, marginBottom: 4 },
  cardSubtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', marginBottom: spacing.sm },
  badge: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%', minHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.heading, fontSize: 18 },
  closeButton: { padding: 4 },
  modalScroll: { padding: spacing.lg },
  applicantCard: { backgroundColor: colors.background, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  applicantLabel: { ...typography.body, fontWeight: '700', marginTop: spacing.sm },
  applicantText: { ...typography.body, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', marginTop: spacing.md }
});
