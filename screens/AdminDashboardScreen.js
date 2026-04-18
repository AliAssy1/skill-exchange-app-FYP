import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import Button from '../components/Button';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import serviceService from '../services/serviceService';
import adminService from '../services/adminService';
import { showAlert, showConfirm } from '../utils/alertHelper';

const C = {
  white: '#FFFFFF',
  bg: '#FAFAFA',
  text: '#18181B',
  sub: '#71717A',
  border: '#E4E4E7',
  primary: '#7C3AED',
  danger: '#E11D48',
  success: '#16A34A',
  warning: '#CA8A04',
  orange: '#EA580C',
};

const STATUS_CONFIG = {
  pending:    { color: C.orange,   bg: '#FFF7ED', label: 'Pending',    icon: 'time-outline' },
  resolved:   { color: C.success,  bg: '#F0FDF4', label: 'Resolved',   icon: 'checkmark-circle-outline' },
  dismissed:  { color: C.sub,      bg: '#F8FAFC', label: 'Dismissed',  icon: 'close-circle-outline' },
};

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('reports');
  const [services, setServices]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [reports, setReports]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);

  // Add-service form
  const [newTitle, setNewTitle]         = useState('');
  const [newCategory, setNewCategory]   = useState('');
  const [newDesc, setNewDesc]           = useState('');
  const [newCredits, setNewCredits]     = useState('');

  // Report detail modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote]           = useState('');
  const [actionLoading, setActionLoading]   = useState(false);

  // Email compose modal
  const [emailTarget, setEmailTarget]   = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody]       = useState('');
  const [emailSending, setEmailSending] = useState(false);

  const { user, logout } = useAuth();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, usrRes, statsRes, rptRes] = await Promise.all([
        serviceService.getAllServices(),
        userService.getAllUsers(),
        adminService.getDashboardStats(),
        adminService.getAllReports(),
      ]);
      if (svcRes.success)   setServices(svcRes.data || []);
      if (usrRes.success)   setUsers(usrRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
      if (rptRes.success)   setReports(rptRes.data || []);
    } catch (e) {
      showAlert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    const ok = await showConfirm('Logout', 'Are you sure?');
    if (!ok) return;
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  // ── Services ────────────────────────────────────────────────────────────
  const handleAddService = async () => {
    if (!newTitle || !newCategory || !newDesc || !newCredits) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    const result = await serviceService.createService({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      credits_cost: parseInt(newCredits),
      duration_minutes: 60,
    });
    if (result.success) {
      showAlert('Success', 'Service created');
      setNewTitle(''); setNewCategory(''); setNewDesc(''); setNewCredits('');
      fetchData();
    } else {
      showAlert('Error', result.message || 'Failed to create service');
    }
  };

  const handleDeleteService = async (id) => {
    const ok = await showConfirm('Remove Service', 'Permanently remove this service?');
    if (!ok) return;
    const result = await serviceService.deleteService(id);
    if (result.success) {
      setServices(p => p.filter(s => s.id !== id));
      showAlert('Success', 'Service removed');
    } else {
      showAlert('Error', result.message || 'Failed');
    }
  };

  // ── Users ───────────────────────────────────────────────────────────────
  const handleSuspend = async (userId, name) => {
    const ok = await showConfirm('Suspend User', `Suspend ${name}?`);
    if (!ok) return;
    const r = await userService.updateUserStatus(userId, 'suspended');
    if (r.success) {
      setUsers(p => p.map(u => u.id === userId ? { ...u, account_status: 'suspended' } : u));
    } else showAlert('Error', r.message);
  };

  const handleActivate = async (userId, name) => {
    const ok = await showConfirm('Activate User', `Reactivate ${name}?`);
    if (!ok) return;
    const r = await userService.updateUserStatus(userId, 'active');
    if (r.success) {
      setUsers(p => p.map(u => u.id === userId ? { ...u, account_status: 'active' } : u));
    } else showAlert('Error', r.message);
  };

  const handleDeleteUser = async (userId, name) => {
    if (userId === user?.id) { showAlert('Error', 'You cannot delete your own account'); return; }
    const ok = await showConfirm('Delete User', `Permanently delete ${name}? This cannot be undone.`);
    if (!ok) return;
    const r = await userService.deleteUser(userId);
    if (r.success) setUsers(p => p.filter(u => u.id !== userId));
    else showAlert('Error', r.message);
  };

  const handleEmailUser = (targetUser) => {
    const addr = targetUser.contact_email || targetUser.email;
    if (!addr) { showAlert('No Email', 'This user has no contact email on file.'); return; }
    setEmailTarget(targetUser);
    setEmailSubject('');
    setEmailBody('');
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      showAlert('Missing Fields', 'Please enter both a subject and a message.');
      return;
    }
    setEmailSending(true);
    const result = await adminService.sendEmailToUser(emailTarget.id, emailSubject.trim(), emailBody.trim());
    setEmailSending(false);
    if (result.success) {
      setEmailTarget(null);
      showAlert('Email Sent', `Message sent to ${emailTarget.contact_email || emailTarget.email}`);
    } else {
      showAlert('Failed', result.message || 'Could not send email. Check Gmail credentials in backend .env');
    }
  };

  // ── Reports ─────────────────────────────────────────────────────────────
  const openReport = (report) => {
    setSelectedReport(report);
    setAdminNote(report.admin_notes || '');
  };

  const handleReportAction = async (status) => {
    if (!selectedReport) return;
    setActionLoading(true);
    const result = await adminService.updateReportStatus(selectedReport.id, status, adminNote);
    setActionLoading(false);
    if (result.success) {
      setReports(p =>
        p.map(r => r.id === selectedReport.id ? { ...r, status, admin_notes: adminNote } : r)
      );
      setSelectedReport(null);
      showAlert('Done', status === 'resolved' ? 'Report marked as resolved.' : 'Report dismissed.');
    } else {
      showAlert('Error', result.message || 'Failed to update report');
    }
  };

  // ── Counts ───────────────────────────────────────────────────────────────
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  // ── Renders ──────────────────────────────────────────────────────────────
  const renderService = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusPill, { backgroundColor: item.status === 'active' ? '#ECFDF5' : '#FEF3C7' }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: item.status === 'active' ? C.success : C.warning }}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.sub}>{item.provider_name || 'Unknown'} · {item.category}</Text>
      <Text style={styles.sub}>💰 {item.credits_cost} credits · ⏱ {item.duration_hours || 0}h</Text>
      <View style={styles.rowEnd}>
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => handleDeleteService(item.id)}>
          <Ionicons name="trash-outline" size={14} color={C.white} />
          <Text style={styles.btnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderUser = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.userRow}>
        <PlaceholderAvatar name={item.full_name} size={46} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemTitle}>{item.full_name}</Text>
            <View style={[styles.statusPill, { backgroundColor: item.account_status === 'active' ? '#ECFDF5' : '#FEF2F2' }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: item.account_status === 'active' ? C.success : C.danger }}>
                {item.account_status}
              </Text>
            </View>
          </View>
          <Text style={styles.sub}>{item.email}</Text>
          {item.contact_email ? (
            <Text style={styles.contactEmail}>
              <Ionicons name="mail-outline" size={11} /> {item.contact_email}
            </Text>
          ) : null}
          <Text style={styles.sub}>{item.major || 'No major'} · {item.role} · {item.credits || 0} credits</Text>
        </View>
      </View>
      <View style={styles.rowEnd}>
        <TouchableOpacity style={[styles.btn, styles.btnInfo]} onPress={() => handleEmailUser(item)}>
          <Ionicons name="mail-outline" size={14} color={C.white} />
          <Text style={styles.btnText}>Email</Text>
        </TouchableOpacity>
        {item.account_status === 'active' ? (
          <TouchableOpacity style={[styles.btn, styles.btnWarning]} onPress={() => handleSuspend(item.id, item.full_name)}>
            <Ionicons name="pause-circle-outline" size={14} color={C.white} />
            <Text style={styles.btnText}>Suspend</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => handleActivate(item.id, item.full_name)}>
            <Ionicons name="checkmark-circle-outline" size={14} color={C.white} />
            <Text style={styles.btnText}>Activate</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => handleDeleteUser(item.id, item.full_name)}>
          <Ionicons name="person-remove-outline" size={14} color={C.white} />
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderReport = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <Card style={styles.itemCard}>
        {/* Status + date row */}
        <View style={styles.rowBetween}>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} />
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={styles.dateText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </Text>
        </View>

        {/* Reporter */}
        <View style={styles.reporterRow}>
          <PlaceholderAvatar name={item.reporter_name || 'Unknown'} size={32} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.reporterLabel}>Reported by</Text>
            <Text style={styles.reporterName}>{item.reporter_name || 'Unknown user'}</Text>
          </View>
        </View>

        {/* Who/what was reported */}
        {item.reported_user_name && (
          <View style={styles.reportedRow}>
            <Ionicons name="person-outline" size={15} color={C.danger} />
            <Text style={styles.reportedText}>
              Reported user: <Text style={{ fontWeight: '700' }}>{item.reported_user_name}</Text>
            </Text>
          </View>
        )}
        {item.reported_service_title && (
          <View style={styles.reportedRow}>
            <Ionicons name="briefcase-outline" size={15} color={C.warning} />
            <Text style={styles.reportedText}>
              Reported service: <Text style={{ fontWeight: '700' }}>{item.reported_service_title}</Text>
            </Text>
          </View>
        )}

        {/* Reason */}
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonValue}>{item.reason || '—'}</Text>
        </View>

        {/* Description preview */}
        {item.description ? (
          <Text style={styles.descPreview} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Admin notes if any */}
        {item.admin_notes ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Admin note:</Text>
            <Text style={styles.noteText}>{item.admin_notes}</Text>
          </View>
        ) : null}

        {/* Action */}
        <View style={styles.rowEnd}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => openReport(item)}>
            <Ionicons name="eye-outline" size={14} color={C.white} />
            <Text style={styles.btnText}>View & Act</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const TABS = [
    { key: 'reports',  label: 'Reports',    icon: 'flag',      badge: pendingCount },
    { key: 'users',    label: 'Users',      icon: 'people',    badge: 0 },
    { key: 'services', label: 'Services',   icon: 'briefcase', badge: 0 },
    { key: 'stats',    label: 'Stats',      icon: 'bar-chart', badge: 0 },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>{user?.full_name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={C.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <View>
              <Ionicons
                name={activeTab === t.key ? t.icon : `${t.icon}-outline`}
                size={20}
                color={activeTab === t.key ? C.primary : C.sub}
              />
              {t.badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{t.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          {/* ── REPORTS TAB ───────────────────────────────────── */}
          {activeTab === 'reports' && (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Summary chips */}
              <View style={styles.summaryChips}>
                {[
                  { label: 'Pending',   count: reports.filter(r => r.status === 'pending').length,   color: C.orange },
                  { label: 'Resolved',  count: reports.filter(r => r.status === 'resolved').length,  color: C.success },
                  { label: 'Dismissed', count: reports.filter(r => r.status === 'dismissed').length, color: C.sub },
                ].map(({ label, count, color }) => (
                  <View key={label} style={[styles.chip, { borderColor: color + '50' }]}>
                    <Text style={[styles.chipCount, { color }]}>{count}</Text>
                    <Text style={styles.chipLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              {reports.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="flag-outline" size={52} color={C.border} />
                  <Text style={styles.emptyTitle}>No reports yet</Text>
                  <Text style={styles.emptySub}>Reports submitted by users will appear here.</Text>
                </View>
              ) : (
                <FlatList
                  data={[...reports].sort((a, b) => {
                    if (a.status === 'pending' && b.status !== 'pending') return -1;
                    if (b.status === 'pending' && a.status !== 'pending') return 1;
                    return new Date(b.created_at) - new Date(a.created_at);
                  })}
                  keyExtractor={item => String(item.id)}
                  renderItem={renderReport}
                  scrollEnabled={false}
                />
              )}
            </ScrollView>
          )}

          {/* ── USERS TAB ─────────────────────────────────────── */}
          {activeTab === 'users' && (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
              <FlatList
                data={users}
                keyExtractor={item => String(item.id)}
                renderItem={renderUser}
                scrollEnabled={false}
              />
            </ScrollView>
          )}

          {/* ── SERVICES TAB ──────────────────────────────────── */}
          {activeTab === 'services' && (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Add Service Form */}
              <Card style={styles.formCard}>
                <Text style={styles.formTitle}>Add New Service</Text>
                {[
                  { placeholder: 'Service Title',    value: newTitle,    setter: setNewTitle },
                  { placeholder: 'Category',          value: newCategory, setter: setNewCategory },
                  { placeholder: 'Credits Cost',      value: newCredits,  setter: setNewCredits, numeric: true },
                ].map(({ placeholder, value, setter, numeric }) => (
                  <TextInput
                    key={placeholder}
                    style={styles.input}
                    placeholder={placeholder}
                    value={value}
                    onChangeText={setter}
                    keyboardType={numeric ? 'numeric' : 'default'}
                    placeholderTextColor={C.sub}
                  />
                ))}
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Description"
                  value={newDesc}
                  onChangeText={setNewDesc}
                  multiline
                  placeholderTextColor={C.sub}
                />
                <Button title="Add Service" onPress={handleAddService} />
              </Card>

              <Text style={styles.sectionTitle}>All Services ({services.length})</Text>
              <FlatList
                data={services}
                keyExtractor={item => String(item.id)}
                renderItem={renderService}
                scrollEnabled={false}
              />
            </ScrollView>
          )}

          {/* ── STATS TAB ─────────────────────────────────────── */}
          {activeTab === 'stats' && (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.statsGrid}>
                {[
                  { label: 'Total Users',      value: stats?.total_users       || users.length,    icon: 'people',         color: C.primary },
                  { label: 'Active Users',      value: users.filter(u => u.account_status === 'active').length, icon: 'person-circle', color: C.success },
                  { label: 'Total Services',    value: stats?.total_services    || services.length, icon: 'briefcase',      color: '#7C3AED' },
                  { label: 'Pending Reports',   value: pendingCount,             icon: 'flag',           color: C.orange },
                  { label: 'Transactions',      value: stats?.total_transactions || 0,              icon: 'swap-horizontal', color: C.primary },
                  { label: 'Completed',         value: stats?.completed_transactions || 0,          icon: 'checkmark-done', color: C.success },
                ].map(({ label, value, icon, color }) => (
                  <View key={label} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
                      <Ionicons name={icon} size={24} color={color} />
                    </View>
                    <Text style={[styles.statValue, { color }]}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <Card style={styles.summaryRow}>
                <Text style={styles.formTitle}>Platform Summary</Text>
                {[
                  ['Credits Circulating', stats?.credits_circulating || 0],
                  ['Suspended Accounts',  users.filter(u => u.account_status === 'suspended').length],
                  ['Total Reports',       reports.length],
                  ['Resolved Reports',    reports.filter(r => r.status === 'resolved').length],
                ].map(([label, val]) => (
                  <View key={label} style={styles.summaryLine}>
                    <Text style={styles.summaryKey}>{label}</Text>
                    <Text style={styles.summaryVal}>{val}</Text>
                  </View>
                ))}
              </Card>
            </ScrollView>
          )}
        </>
      )}

      {/* ── Email Compose Modal ─────────────────────────────── */}
      <Modal visible={!!emailTarget} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {emailTarget && (
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Email</Text>
                <TouchableOpacity onPress={() => setEmailTarget(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={C.sub} />
                </TouchableOpacity>
              </View>

              {/* Recipient */}
              <View style={styles.emailRecipientRow}>
                <Ionicons name="person-circle-outline" size={20} color={C.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.emailRecipientName}>{emailTarget.full_name}</Text>
                  <Text style={styles.emailRecipientAddr}>
                    {emailTarget.contact_email || emailTarget.email}
                  </Text>
                </View>
              </View>

              <Text style={[styles.modalSectionLabel, { marginTop: 12 }]}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Email subject..."
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholderTextColor={C.sub}
              />

              <Text style={styles.modalSectionLabel}>Message</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Write your message here..."
                value={emailBody}
                onChangeText={setEmailBody}
                multiline
                placeholderTextColor={C.sub}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnResolve, emailSending && styles.btnDisabled]}
                  onPress={handleSendEmail}
                  disabled={emailSending}
                >
                  {emailSending ? (
                    <ActivityIndicator size="small" color={C.white} />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color={C.white} />
                      <Text style={styles.modalBtnText}>Send Email</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnDismiss]}
                  onPress={() => setEmailTarget(null)}
                >
                  <Text style={[styles.modalBtnText, { color: C.sub }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Report Detail Modal ──────────────────────────────── */}
      <Modal visible={!!selectedReport} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {selectedReport && (() => {
            const cfg = STATUS_CONFIG[selectedReport.status] || STATUS_CONFIG.pending;
            return (
              <View style={styles.modalBox}>
                {/* Modal header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Report #{selectedReport.id}</Text>
                  <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color={C.sub} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Status */}
                  <View style={[styles.statusPill, { backgroundColor: cfg.bg, alignSelf: 'flex-start', marginBottom: 16 }]}>
                    <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                    <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>

                  {/* Reporter */}
                  <Text style={styles.modalSectionLabel}>Reported By</Text>
                  <View style={styles.reporterRow}>
                    <PlaceholderAvatar name={selectedReport.reporter_name} size={40} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.itemTitle}>{selectedReport.reporter_name || 'Unknown'}</Text>
                      {selectedReport.reporter_email && (
                        <Text style={styles.sub}>{selectedReport.reporter_email}</Text>
                      )}
                    </View>
                  </View>

                  {/* Subject */}
                  {selectedReport.reported_user_name && (
                    <>
                      <Text style={styles.modalSectionLabel}>Reported User</Text>
                      <View style={styles.reporterRow}>
                        <PlaceholderAvatar name={selectedReport.reported_user_name} size={40} />
                        <View style={{ marginLeft: 10 }}>
                          <Text style={styles.itemTitle}>{selectedReport.reported_user_name}</Text>
                          {selectedReport.reported_user_email && (
                            <Text style={styles.sub}>{selectedReport.reported_user_email}</Text>
                          )}
                        </View>
                      </View>
                    </>
                  )}
                  {selectedReport.reported_service_title && (
                    <>
                      <Text style={styles.modalSectionLabel}>Reported Service</Text>
                      <Text style={styles.itemTitle}>{selectedReport.reported_service_title}</Text>
                    </>
                  )}

                  {/* Reason */}
                  <Text style={styles.modalSectionLabel}>Reason</Text>
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonValue}>{selectedReport.reason}</Text>
                  </View>

                  {/* Description */}
                  <Text style={styles.modalSectionLabel}>Description</Text>
                  <View style={[styles.reasonBox, { marginBottom: 16 }]}>
                    <Text style={[styles.sub, { lineHeight: 20 }]}>
                      {selectedReport.description || 'No description provided.'}
                    </Text>
                  </View>

                  {/* Date */}
                  <Text style={styles.sub}>
                    Submitted: {selectedReport.created_at
                      ? new Date(selectedReport.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Unknown'}
                  </Text>

                  {/* Admin note input */}
                  <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>Admin Note (optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Add a note about your decision..."
                    value={adminNote}
                    onChangeText={setAdminNote}
                    multiline
                    placeholderTextColor={C.sub}
                  />

                  {/* Action buttons — only for pending */}
                  {selectedReport.status === 'pending' && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.modalBtnResolve, actionLoading && styles.btnDisabled]}
                        onPress={() => handleReportAction('resolved')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator size="small" color={C.white} />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                            <Text style={styles.modalBtnText}>Mark Resolved</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalBtn, styles.modalBtnDismiss, actionLoading && styles.btnDisabled]}
                        onPress={() => handleReportAction('dismissed')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={C.sub} />
                        <Text style={[styles.modalBtnText, { color: C.sub }]}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedReport.status !== 'pending' && (
                    <View style={[styles.reasonBox, { backgroundColor: cfg.bg, marginTop: 12 }]}>
                      <Text style={[styles.sub, { color: cfg.color, fontWeight: '600' }]}>
                        This report has already been {selectedReport.status}.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            );
          })()}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.primary,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  logoutText:  { fontSize: 13, fontWeight: '700', color: C.danger },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, position: 'relative' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.sub },
  tabLabelActive: { color: C.primary },
  tabBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: C.orange, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },

  // Content
  content: { flex: 1, padding: 16 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: C.sub, fontSize: 14 },

  // Summary chips (reports)
  summaryChips: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: { flex: 1, backgroundColor: C.white, borderRadius: 12, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  chipCount: { fontSize: 22, fontWeight: '800' },
  chipLabel: { fontSize: 11, color: C.sub, fontWeight: '600', marginTop: 2 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginTop: 14, marginBottom: 6 },
  emptySub: { fontSize: 14, color: C.sub, textAlign: 'center' },

  // Cards
  itemCard: { marginBottom: 12, borderWidth: 1, borderColor: C.border },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 8 },

  // Text
  itemTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  sub: { fontSize: 13, color: C.sub, marginTop: 2 },
  dateText: { fontSize: 11, color: C.sub },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 12 },

  // Status pill
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '700' },

  // Report-specific
  reporterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reporterLabel: { fontSize: 11, color: C.sub, fontWeight: '500' },
  reporterName: { fontSize: 14, fontWeight: '700', color: C.text },
  reportedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  reportedText: { fontSize: 13, color: C.sub, flex: 1 },
  reasonBox: { backgroundColor: C.bg, borderRadius: 8, padding: 10, marginBottom: 10 },
  reasonLabel: { fontSize: 11, color: C.sub, fontWeight: '600', marginBottom: 3 },
  reasonValue: { fontSize: 14, color: C.text, fontWeight: '600' },
  descPreview: { fontSize: 13, color: C.sub, lineHeight: 18, marginBottom: 6 },
  noteBox: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginBottom: 8 },
  noteLabel: { fontSize: 11, color: C.success, fontWeight: '700', marginBottom: 2 },
  noteText: { fontSize: 13, color: C.text },

  // Buttons
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  btnText: { fontSize: 12, fontWeight: '700', color: C.white },
  btnPrimary: { backgroundColor: C.primary },
  btnSuccess: { backgroundColor: C.success },
  btnWarning: { backgroundColor: C.warning },
  btnDanger:  { backgroundColor: C.danger },
  btnInfo:    { backgroundColor: '#0891B2' },
  btnDisabled: { opacity: 0.5 },
  contactEmail: { fontSize: 12, color: '#0891B2', marginTop: 2, fontWeight: '500' },

  // Add-service form
  formCard: { marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: C.white, fontSize: 14, color: C.text },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '47%', backgroundColor: C.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: C.sub, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  summaryRow: { borderWidth: 1, borderColor: C.border },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryKey: { fontSize: 14, color: C.sub },
  summaryVal: { fontSize: 14, fontWeight: '700', color: C.text },

  emailRecipientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 8 },
  emailRecipientName: { fontSize: 14, fontWeight: '700', color: C.text },
  emailRecipientAddr: { fontSize: 12, color: C.sub, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  closeBtn: { padding: 4 },
  modalSectionLabel: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 },
  modalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  modalBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
  modalBtnResolve: { backgroundColor: C.success },
  modalBtnDismiss: { backgroundColor: C.border },
});
