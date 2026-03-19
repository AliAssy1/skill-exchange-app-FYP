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
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import serviceService from '../services/serviceService';
import adminService from '../services/adminService';
import { showAlert, showConfirm } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
  danger: '#DC2626',
  success: '#059669',
  warning: '#F59E0B',
};

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceCredits, setNewServiceCredits] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  // Fetch real data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch services
      const servicesResult = await serviceService.getAllServices();
      if (servicesResult.success) {
        setServices(servicesResult.data);
      }

      // Fetch users (admin only)
      const usersResult = await userService.getAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }

      // Fetch dashboard stats
      const statsResult = await adminService.getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Error', '❌ Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    const confirmed = await showConfirm('Logout', 'Are you sure you want to logout?');
    
    if (!confirmed) return;
    
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };

  const handleViewService = (service) => {
    const serviceInfo = `
Title: ${service.title}
Provider: ${service.provider_name || service.full_name || 'Unknown'}
Category: ${service.category}
Description: ${service.description || 'No description'}
Credits: ${service.credits_cost || 0}
Duration: ${service.duration_hours || 0} hours
Status: ${service.status}
Created: ${new Date(service.created_at).toLocaleDateString()}`;
    
    showAlert('Service Details', serviceInfo);
  };

  const confirmRemoveService = async (serviceId) => {
    const confirmed = await showConfirm('Confirm Removal', 'Are you sure you want to permanently remove this service?');
    
    if (!confirmed) return;
    
    try {
      const result = await serviceService.deleteService(serviceId);
      if (result.success) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
        showAlert('Success', '✅ Service removed successfully');
        fetchData();
      } else {
        showAlert('Error', '❌ ' + (result.message || 'Failed to remove service'));
      }
    } catch (error) {
      showAlert('Error', '❌ Failed to remove service');
      console.error('Remove service error:', error);
    }
  };

  const handleRemoveService = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      handleViewService(service);
    } else {
      confirmRemoveService(serviceId);
    }
  };

  const handleAddService = async () => {
    if (!newServiceTitle || !newServiceCategory || !newServiceDescription || !newServiceCredits) {
      showAlert('Error', '❌ Please fill in all fields');
      return;
    }

    try {
      const serviceData = {
        title: newServiceTitle,
        description: newServiceDescription,
        category: newServiceCategory,
        credits_cost: parseInt(newServiceCredits),
        duration_minutes: 60
      };

      const result = await serviceService.createService(serviceData);
      if (result.success) {
        showAlert('Success', '✅ Service created successfully');
        setNewServiceTitle('');
        setNewServiceCategory('');
        setNewServiceDescription('');
        setNewServiceCredits('');
        fetchData(); // Refresh the list
      } else {
        showAlert('Error', '❌ ' + (result.message || 'Failed to create service'));
      }
    } catch (error) {
      showAlert('Error', '❌ Failed to create service');
      console.error('Create service error:', error);
    }
  };

  const handleViewUser = (user) => {
    const userInfo = `
👤 User Details

👤 Name: ${user.full_name}
📧 Email: ${user.email}
🎓 Role: ${user.role.toUpperCase()}
📚 Major: ${user.major || 'N/A'}
📅 Year: ${user.year_of_study || 'N/A'}
💰 Credits: ${user.credits || 0}
⭐ Reputation: ${user.reputation_score ? Number(user.reputation_score).toFixed(1) : '0.0'} (${user.total_reviews || 0} reviews)
📊 Status: ${user.account_status.toUpperCase()}
🗓️ Joined: ${new Date(user.created_at).toLocaleDateString()}`;
    
    showAlert('User Details', userInfo);
  };

  const handleSuspendUser = async (userId, userName) => {
    const confirmed = await showConfirm('Suspend User', `Are you sure you want to suspend ${userName}?\n\nThey will not be able to log in.`);
    
    if (!confirmed) return;
    
    try {
      const result = await userService.updateUserStatus(userId, 'suspended');
      if (result.success) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, account_status: 'suspended' } : u
        ));
        showAlert('Success', '✅ User suspended successfully');
        fetchData(); // Refresh
      } else {
        showAlert('Error', '❌ ' + (result.message || 'Failed to suspend user'));
      }
    } catch (error) {
      showAlert('Error', '❌ An error occurred');
      console.error('Suspend error:', error);
    }
  };

  const handleActivateUser = async (userId, userName) => {
    const confirmed = await showConfirm('Activate User', `Reactivate ${userName}?\n\nThey will regain access.`);
    
    if (!confirmed) return;
    
    try {
      const result = await userService.updateUserStatus(userId, 'active');
      if (result.success) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, account_status: 'active' } : u
        ));
        showAlert('Success', '✅ User activated successfully');
        fetchData(); // Refresh
      } else {
        showAlert('Error', '❌ ' + (result.message || 'Failed to activate user'));
      }
    } catch (error) {
      showAlert('Error', '❌ An error occurred');
      console.error('Activate error:', error);
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    // Prevent admin from deleting themselves
    if (userId === user?.id) {
      showAlert('Error', '❌ You cannot delete your own account!');
      return;
    }
    
    const confirmed = await showConfirm('Delete User', `⚠️ PERMANENT ACTION!\n\nDelete ${userName}?\n\nThis cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
      const result = await userService.deleteUser(userId);
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showAlert('Success', '✅ User removed successfully');
        fetchData(); // Refresh
      } else {
        showAlert('Error', '❌ ' + (result.message || 'Failed to delete'));
      }
    } catch (error) {
      showAlert('Error', '❌ An error occurred');
      console.error('Delete error:', error);
    }
  };

  const renderServiceItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={[styles.statusBadge, { color: item.status === 'active' ? COLORS.success : COLORS.warning }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.itemSubtext}>{item.provider_name || item.full_name || 'Unknown'} • {item.category}</Text>
      <View style={styles.itemMeta}>
        <Text style={styles.metaText}>Credits: {item.credits_cost || 0}</Text>
        <Text style={styles.metaText}> • Duration: {item.duration_hours || 0}h</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]} 
          onPress={() => handleViewService(item)}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.removeButton]} 
          onPress={() => confirmRemoveService(item.id)}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderUserItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.userInfo}>
        <PlaceholderAvatar name={item.full_name} size={50} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.full_name}</Text>
          <Text style={styles.itemSubtext}>{item.email}</Text>
          <Text style={styles.itemSubtext}>{item.major || 'No major'} • {item.role}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.metaText}>💰 {item.credits || 0}</Text>
            <Text style={styles.metaText}> • ⭐ {item.reputation_score ? Number(item.reputation_score).toFixed(1) : '0.0'}</Text>
            <Text style={[styles.statusBadge, { color: item.account_status === 'active' ? COLORS.success : COLORS.danger }]}>
              {item.account_status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewUser(item)}
        >
          <Text style={styles.actionButtonText}>View Info</Text>
        </TouchableOpacity>
        {item.account_status === 'active' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.suspendButton]}
            onPress={() => handleSuspendUser(item.id, item.full_name)}
          >
            <Text style={styles.actionButtonText}>Suspend</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handleActivateUser(item.id, item.full_name)}
          >
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.removeUserButton]}
          onPress={() => handleRemoveUser(item.id, item.full_name)}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Admin Header */}
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderLeft}>
          <Text style={styles.adminTitle}>Admin Dashboard</Text>
          <Text style={styles.adminSubtitle}>{user?.full_name || 'Admin'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'services' && styles.activeTab]}
              onPress={() => setActiveTab('services')}
            >
              <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
                Services
              </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Statistics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add Service Form */}
          <Card style={styles.addForm}>
            <Text style={styles.formTitle}>Add New Service</Text>
            <TextInput
              style={styles.input}
              placeholder="Service Title"
              value={newServiceTitle}
              onChangeText={setNewServiceTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newServiceDescription}
              onChangeText={setNewServiceDescription}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Category (e.g., Programming, Design)"
              value={newServiceCategory}
              onChangeText={setNewServiceCategory}
            />
            <TextInput
              style={styles.input}
              placeholder="Credits Cost"
              value={newServiceCredits}
              onChangeText={setNewServiceCredits}
              keyboardType="numeric"
            />
            <Button title="Add Service" onPress={handleAddService} />
          </Card>

          {/* Services List */}
          <Text style={styles.sectionTitle}>Manage Services ({services.length})</Text>
          <FlatList
            data={services}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderServiceItem}
            scrollEnabled={false}
          />
        </ScrollView>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Manage Users ({users.length})</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderUserItem}
            scrollEnabled={false}
          />
        </ScrollView>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_users || users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{users.filter(u => u.account_status === 'active').length}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_services || services.length}</Text>
            <Text style={styles.statLabel}>Total Services</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.pending_reports || 0}</Text>
            <Text style={styles.statLabel}>Pending Reports</Text>
          </Card>

          {/* Platform Overview */}
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          
          <Card style={styles.summaryCard}>
            <Text style={styles.itemText}>Total Transactions: {stats?.total_transactions || 0}</Text>
            <Text style={styles.itemText}>Completed Transactions: {stats?.completed_transactions || 0}</Text>
            <Text style={styles.itemText}>Credits Circulating: {stats?.credits_circulating || 0}</Text>
            <Text style={styles.itemText}>
              Suspended Accounts: {users.filter(u => u.account_status === 'suspended').length}
            </Text>
          </Card>
        </ScrollView>
      )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.secondary,
  },
  adminHeader: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminHeaderLeft: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  adminSubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    padding: 16,
  },
  addForm: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.secondary,
    marginRight: 12,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 8,
  },
  actionButtonText: {
    fontWeight: '600',
    color: COLORS.white,
  },
  viewButton: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  removeButton: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  suspendButton: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  activateButton: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  removeUserButton: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  statCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
});
