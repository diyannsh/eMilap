import {
  AlertCircle,
  Bell,
  CheckCircle,
  FileSearch,
  Home,
  Lock,
  Search,
  Settings,
  Shield,
} from '../lib/icons.js';

export const navigationItems = [
  { id: 'dashboard', icon: Home, label: 'Overview' },
  { id: 'report_lost', icon: AlertCircle, label: 'Report Lost' },
  { id: 'report_found', icon: CheckCircle, label: 'Report Found' },
  { id: 'browse', icon: Search, label: 'Campus Listings' },
  { id: 'matches', icon: FileSearch, label: 'Possible Matches' },
  { id: 'claims', icon: Lock, label: 'Ownership Claims' },
  { id: 'notifications', icon: Bell, label: 'Updates' },
  { id: 'admin', icon: Shield, label: 'Moderation' },
  { id: 'settings', icon: Settings, label: 'Account Settings' },
];
