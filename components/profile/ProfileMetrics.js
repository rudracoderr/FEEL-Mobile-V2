import { StyleSheet, View } from 'react-native';
import MetricCard from '../ui/MetricCard';
import SectionHeader from '../ui/SectionHeader';
import { spacing } from '../../theme';

/**
 * @param {object} metrics - { submitted: number, active: number, completed: number }
 */
export default function ProfileMetrics({ metrics }) {
  return (
    <>
      <SectionHeader title="Impact metrics" subtitle="Only real activity from your account is shown." />
      <View style={styles.metricsRow}>
        <MetricCard label="Reports Submitted" value={metrics.submitted} />
        <MetricCard label="Active Rescues" value={metrics.active} tone="medium" />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Rescues Completed" value={metrics.completed} tone="success" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});
