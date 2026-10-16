import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelLeave, getMyLeave, requestLeave } from "@/lib/api/leave.api";
import { useThemePrefs } from "@/store/theme";
import { pressStyle } from "@/lib/pressFeedback";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { LeaveTypeChips } from "@/components/leave/LeaveTypeChips";
import { ActiveLeaveBalancesSection } from "@/components/leave/ActiveLeaveBalancesSection";
import { AllLeaveBalancesModal } from "@/components/leave/AllLeaveBalancesModal";
import { getMyLeaveBalances } from "@/lib/api/leaveBalances.api";
import { LeaveRequestCard } from "@/components/leave/LeaveRequestCard";
import { parseYmd, startOfToday } from "@/lib/dates";
import { useToast } from "@/components/toast";
import { themedRefreshControlProps } from "@/lib/themedRefreshControl";
import { useAutoDismissAlert, useTransientQueryError } from "@/hooks/useAutoDismissAlert";
import { TransientAlert } from "@/components/ui/TransientAlert";
import { translate } from "@/lib/i18n";

const SCREEN_PADDING = 22;

export default function LeaveScreen() {
  const { colors } = useThemePrefs();
  const { show: showToast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<string>("annual");
  const [reason, setReason] = useState("");
  const [allBalancesOpen, setAllBalancesOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { alert: formError, show: showFormError, clear: clearFormError } = useAutoDismissAlert();

  const leaveMinDate = useMemo(() => startOfToday(), []);
  const minEndDate = useMemo(() => {
    const start = parseYmd(startDate);
    return start && start >= leaveMinDate ? start : leaveMinDate;
  }, [startDate, leaveMinDate]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = parseYmd(startDate);
    const end = parseYmd(endDate);
    if (start && end && end < start) setEndDate("");
  }, [startDate, endDate]);

  const balancesQuery = useQuery({
    queryKey: ["leave", "balances", "my"],
    queryFn: async () => {
      const res = await getMyLeaveBalances();
      if (res.success === false) throw new Error(res.error ?? translate("leave.failedLoadBalances"));
      return res.data ?? [];
    },
  });

  const { data, isLoading, isError, error, isRefetching: leaveRefetching } = useQuery({
    queryKey: ["leave", "my"],
    queryFn: async () => {
      const res = await getMyLeave();
      if (res.success === false) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      clearFormError();
      if (!startDate || !endDate) {
        throw new Error(translate("leave.selectDates"));
      }
      const start = parseYmd(startDate);
      const end = parseYmd(endDate);
      if (!start || !end) {
        throw new Error(translate("leave.invalidDateSelection"));
      }
      if (start > end) {
        throw new Error(translate("leave.endOnOrAfterStart"));
      }
      const res = await requestLeave({
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        reason: reason.trim() || undefined,
      });
      if (res.success === false) throw new Error(res.error ?? translate("leave.requestFailed"));
      return res.data;
    },
    onSuccess: () => {
      setStartDate("");
      setEndDate("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["leave", "my"] });
      showToast({
        message: translate("leave.requestSubmitted"),
        subtitle: translate("leave.managerWillReview"),
        variant: "success",
      });
    },
    onError: (e: Error) => {
      showFormError(e.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      setCancellingId(leaveId);
      const res = await cancelLeave(leaveId);
      if (res.success === false) throw new Error(res.error ?? translate("leave.cancelFailed"));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave", "my"] });
      showToast({ message: translate("leave.requestCancelled"), variant: "success" });
    },
    onError: (e: Error) => {
      showToast({ message: e.message || translate("leave.failedCancelRequest"), variant: "error" });
    },
    onSettled: () => setCancellingId(null),
  });

  const list = data ?? [];
  const allBalances = balancesQuery.data ?? [];
  const balancesError =
    balancesQuery.isError && balancesQuery.error instanceof Error
      ? balancesQuery.error.message
      : balancesQuery.isError
        ? translate("leave.failedLoadBalances")
        : null;

  const requestsLoadError = isError
    ? error instanceof Error
      ? error.message
      : translate("leave.failedLoad")
    : null;
  const { alert: requestsErrorAlert, clear: clearRequestsError } =
    useTransientQueryError(requestsLoadError);

  const refreshing = balancesQuery.isRefetching || leaveRefetching;

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["leave"] });
  }, [queryClient]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearFormError();
        clearRequestsError();
      };
    }, [clearFormError, clearRequestsError])
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...themedRefreshControlProps(colors)}
          />
        }
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>{translate("navigation.leave")}</Text>
        <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
          {translate("leave.subtitleMobile")}
        </Text>

        <ActiveLeaveBalancesSection
          colors={colors}
          balances={allBalances}
          loading={balancesQuery.isLoading}
          loaded={balancesQuery.isSuccess}
          error={balancesError}
          onViewAll={() => setAllBalancesOpen(true)}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{translate("leave.newRequest")}</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {formError ? (
            <TransientAlert message={formError} colors={colors} style={styles.formErrorBox} />
          ) : null}

          <DatePickerField
            label={translate("leave.startDate")}
            value={startDate}
            onChange={setStartDate}
            colors={colors}
            minimumDate={leaveMinDate}
          />
          <DatePickerField
            label={translate("leave.endDate")}
            value={endDate}
            onChange={setEndDate}
            colors={colors}
            minimumDate={minEndDate}
          />

          <LeaveTypeChips value={leaveType} onChange={setLeaveType} colors={colors} />

          <Text style={[styles.inputLabel, { color: colors.muted }]}>{translate("leave.reasonOptional")}</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={translate("leave.reasonPlaceholderMobile")}
            placeholderTextColor={colors.muted}
            multiline
            style={[
              styles.textArea,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
                color: colors.text,
              },
            ]}
          />

          <Pressable
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary },
              mutation.isPending && styles.submitBtnDisabled,
              pressStyle({ pressed: pressed || mutation.isPending }, { scale: 0.99 }),
            ]}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.onPrimary }]}>
                {translate("leave.submitRequest")}
              </Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionGap, { color: colors.text }]}>
          {translate("leave.myRequests")}
        </Text>
        {requestsErrorAlert ? (
          <TransientAlert
            message={requestsErrorAlert}
            colors={colors}
            style={styles.requestsError}
          />
        ) : null}
        {isLoading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.muted, { color: colors.muted }]}>{translate("leave.loadingRequests")}</Text>
          </View>
        ) : isError ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{translate("leave.couldNotLoadRequests")}</Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>
              {translate("leave.pullToRefresh")}
            </Text>
          </View>
        ) : list.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{translate("leave.noRequestsYet")}</Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>
              {translate("leave.submitFirstAbove")}
            </Text>
          </View>
        ) : (
          list.map((item) => (
            <LeaveRequestCard
              key={item.id}
              item={item}
              colors={colors}
              cancelDisabled={cancelMutation.isPending && cancellingId === item.id}
              onCancel={(leaveId) => {
                Alert.alert(
                  translate("leave.cancelLeaveRequestTitle"),
                  translate("leave.cancelLeaveRequestBody"),
                  [
                    { text: translate("leave.keepRequest"), style: "cancel" },
                    {
                      text: translate("leave.cancelLeaveRequest"),
                      style: "destructive",
                      onPress: () => cancelMutation.mutate(leaveId),
                    },
                  ]
                );
              }}
            />
          ))
        )}
      </ScrollView>

      <AllLeaveBalancesModal
        visible={allBalancesOpen}
        onClose={() => setAllBalancesOpen(false)}
        colors={colors}
        balances={allBalances}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 48,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  sectionGap: { marginTop: 8 },
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 8,
  },
  formErrorBox: {
    marginBottom: 4,
  },
  requestsError: {
    marginBottom: 10,
  },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 88,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: { fontSize: 16, fontWeight: "700" },
  formError: { fontSize: 14, fontWeight: "600" },
  muted: { fontSize: 14 },
  loadingInline: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyBody: { fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 },
});
