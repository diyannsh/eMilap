/**
 * eMilap Campus Lost & Found Mock Store
 * Provides persistent state via localStorage with rich seed data for campus items,
 * notifications, matches, and claims.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEYS = {
  ITEMS: 'emilap_items_v1',
  NOTIFICATIONS: 'emilap_notifications_v1',
  CLAIMS: 'emilap_claims_v1',
};

export const CAMPUS_ZONES = [
  'All Campus Locations',
  'Main Library',
  'Student Union & Dining',
  'Engineering Quad',
  'Science & Tech Center',
  'Sports & Recreation Arena',
  'Admin & Registrar Building',
  'North & South Residence Halls',
  'Campus Green & Outdoor Paths',
];

export const ITEM_CATEGORIES = [
  'All Categories',
  'Electronics',
  'Bags & Backpacks',
  'Keys & IDs',
  'Water Bottles',
  'Clothing & Accessories',
  'Books & Supplies',
  'Other',
];

const INITIAL_ITEMS = [
  {
    id: 'item-1',
    status: 'FOUND',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'Electronics',
    color: 'White',
    location: 'Main Library',
    spot: '2nd Floor Silent Study Desk 14',
    date: 'Today, 10:15 AM',
    timestamp: Date.now() - 1000 * 60 * 90,
    description: 'White AirPods charging case with both earbuds inside. Found on desk 14 next to the east window.',
    privateClue: 'Engraved with initials "D.V." on bottom of case, left earbud has faint scratch.',
    contact: 'Campus Desk - Main Library (Desk A)',
    isSample: true,
  },
  {
    id: 'item-2',
    status: 'LOST',
    title: 'The North Face Surge Backpack',
    category: 'Bags & Backpacks',
    color: 'Black',
    location: 'Student Union & Dining',
    spot: 'Cafeteria booth near west windows',
    date: 'Yesterday, 3:30 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 22,
    description: 'Black backpack with red cord zipper pulls, laptop sleeve, and side water bottle pocket.',
    privateClue: 'Contains a blue spiral notebook and campus gym membership card in inner sleeve.',
    contact: 'Student Reporter ••••1904',
    isSample: true,
  },
  {
    id: 'item-3',
    status: 'FOUND',
    title: 'Casio FX-991EX ClassWiz Calculator',
    category: 'Electronics',
    color: 'Black / Silver',
    location: 'Engineering Quad',
    spot: 'Lecture Hall 302, 3rd row desk',
    date: 'Yesterday, 1:45 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 25,
    description: 'Scientific calculator left behind after Calculus III lecture.',
    privateClue: 'Silver sharpie initials "A.M." inside battery slip cover.',
    contact: 'Engineering Dept Office (Hall 105)',
    isSample: true,
  },
  {
    id: 'item-4',
    status: 'FOUND',
    title: 'Student ID Card & Dorm Keyring',
    category: 'Keys & IDs',
    color: 'Navy / Silver',
    location: 'Science & Tech Center',
    spot: 'Chemistry Lab Bench 4',
    date: '2 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    description: 'Official campus student ID card on navy lanyard with two brass dorm keys and a mini carabiner.',
    privateClue: 'Student ID number ends with 4821.',
    contact: 'Security Post B (Main Gate)',
    isSample: true,
  },
  {
    id: 'item-5',
    status: 'LOST',
    title: 'Hydro Flask 32oz Wide Mouth',
    category: 'Water Bottles',
    color: 'Pacific Blue',
    location: 'Sports & Recreation Arena',
    spot: 'Bleachers near basketball court 2',
    date: '3 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 70,
    description: 'Pacific blue water bottle with black flex cap and black silicone boot on bottom.',
    privateClue: 'Yosemite National Park sticker on one side and slight dent on bottom rim.',
    contact: 'Student Reporter ••••7721',
    isSample: true,
  },
  {
    id: 'item-6',
    status: 'FOUND',
    title: 'Sony WH-1000XM4 Headphones',
    category: 'Electronics',
    color: 'Silver / Grey',
    location: 'Main Library',
    spot: 'Ground floor lounge near cafe',
    date: '3 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 76,
    description: 'Over-ear wireless noise cancelling headphones in grey zippered hardshell case.',
    privateClue: 'Small purple carabiner clip attached to zipper loop of case.',
    contact: 'Library Help Desk',
    isSample: true,
  },
  {
    id: 'item-7',
    status: 'LOST',
    title: 'Leather Cardholder Wallet',
    category: 'Clothing & Accessories',
    color: 'Brown',
    location: 'Admin & Registrar Building',
    spot: 'Waiting area outside financial aid desk',
    date: '4 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
    description: 'Dark brown textured leather cardholder with 4 card slots and folded cash pocket.',
    privateClue: 'Contains city transit card expiring Nov 2026 and university meal card.',
    contact: 'Student Reporter ••••3319',
    isSample: true,
  },
  {
    id: 'item-8',
    status: 'FOUND',
    title: 'Linear Algebra 5th Edition Textbook',
    category: 'Books & Supplies',
    color: 'Blue / Yellow',
    location: 'Science & Tech Center',
    spot: 'Study tables on 2nd floor atrium',
    date: '5 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 120,
    description: 'Hardcover textbook by Gilbert Strang, yellow highlights in chapters 2 & 3.',
    privateClue: 'Sticky note inside front cover with student email and recitation room number.',
    contact: 'Math Dept Student Lounge',
    isSample: true,
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'match',
    title: 'Potential Match Identified',
    message: 'A found "Black Backpack" in Student Union matches your lost report from yesterday (92% confidence).',
    time: '15 mins ago',
    read: false,
    linkView: 'matches',
    badge: '92% Match',
  },
  {
    id: 'notif-2',
    type: 'claim',
    title: 'Ownership Claim Verification Pending',
    message: 'Student ID ••••4821 submitted a private verification detail for "Casio FX-991EX Calculator".',
    time: '2 hours ago',
    read: false,
    linkView: 'claims',
    badge: 'Audit Needed',
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'Campus Lost Property Notice',
    message: 'Items held for over 60 days will be consolidated at the Central Security Vault on Friday.',
    time: '1 day ago',
    read: true,
    linkView: 'browse',
    badge: 'Campus Policy',
  },
  {
    id: 'notif-4',
    type: 'report',
    title: 'Report Published Successfully',
    message: 'Your report for "The North Face Surge Backpack" is active in Campus Listings.',
    time: '2 days ago',
    read: true,
    linkView: 'browse',
    badge: 'Active',
  },
];

const INITIAL_CLAIMS = [
  {
    id: 'claim-1',
    itemTitle: 'Casio FX-991EX ClassWiz Calculator',
    claimant: 'Alex M.',
    studentIdMasked: '••••4821',
    submittedTime: '2 hours ago',
    status: 'Under Review', // 'Under Review' | 'Approved' | 'Rejected'
    category: 'Electronics',
    location: 'Engineering Quad, Hall 302',
    privateClue: 'A small scratch is on the top-right corner, and initials "A.M." are written inside the battery cover in silver sharpie.',
    systemMatchNote: 'The private detail matches the secure notes stored with the original found item report.',
    isVerifiedUnlocked: false,
  },
  {
    id: 'claim-2',
    itemTitle: 'Apple AirPods Pro (2nd Gen)',
    claimant: 'David V.',
    studentIdMasked: '••••6109',
    submittedTime: '4 hours ago',
    status: 'Under Review',
    category: 'Electronics',
    location: 'Main Library, Floor 2',
    privateClue: 'Engraved with initials "D.V." on the bottom of the case. Left earbud has a hairline scratch near the microphone grille.',
    systemMatchNote: 'Engraving and scratch location match physical inspection of the surrendered case.',
    isVerifiedUnlocked: false,
  },
];

// Helper to safely read from localStorage
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Helper to safely write to localStorage
function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage', err);
  }
}

// Global Event Dispatcher to notify across components in the same window
const EVENT_NAME = 'emilap_store_updated';
function broadcastStoreChange() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

// API methods
export const mockStore = {
  getItems() {
    return readStorage(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  },

  addItem(newItem) {
    const items = this.getItems();
    const itemWithId = {
      ...newItem,
      id: `item-${Date.now()}`,
      timestamp: Date.now(),
      date: 'Just now',
    };
    const updated = [itemWithId, ...items];
    writeStorage(STORAGE_KEYS.ITEMS, updated);

    // Auto-create notification for submission
    this.addNotification({
      type: 'report',
      title: `${newItem.status === 'LOST' ? 'Lost Item' : 'Found Item'} Report Logged`,
      message: `Your report for "${newItem.title}" at ${newItem.location} is now active and indexed.`,
      linkView: 'browse',
      badge: 'New',
    });

    // Check if it creates a potential match alert
    const similar = items.find(
      (existing) =>
        existing.status !== newItem.status &&
        (existing.category === newItem.category ||
          existing.title.toLowerCase().includes(newItem.title.toLowerCase()) ||
          newItem.title.toLowerCase().includes(existing.title.toLowerCase()))
    );

    if (similar) {
      this.addNotification({
        type: 'match',
        title: 'New Possible Match Detected!',
        message: `Your new report "${newItem.title}" potentially matches "${similar.title}" at ${similar.location}.`,
        linkView: 'matches',
        badge: 'Match Alert',
      });
    }

    broadcastStoreChange();
    return itemWithId;
  },

  getNotifications() {
    return readStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  addNotification(notif) {
    const list = this.getNotifications();
    const created = {
      ...notif,
      id: `notif-${Date.now()}`,
      time: 'Just now',
      read: false,
    };
    const updated = [created, ...list];
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    broadcastStoreChange();
    return created;
  },

  markNotificationRead(id) {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    broadcastStoreChange();
  },

  markAllNotificationsRead() {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, read: true }));
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    broadcastStoreChange();
  },

  clearNotifications() {
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    broadcastStoreChange();
  },

  getClaims() {
    return readStorage(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
  },

  updateClaimStatus(claimId, status) {
    const claims = this.getClaims();
    const updated = claims.map((c) => (c.id === claimId ? { ...c, status } : c));
    writeStorage(STORAGE_KEYS.CLAIMS, updated);

    const claim = claims.find((c) => c.id === claimId);
    if (claim) {
      this.addNotification({
        type: 'claim',
        title: `Claim ${status}`,
        message: `Ownership claim for "${claim.itemTitle}" was marked as ${status}.`,
        linkView: 'claims',
        badge: status,
      });
    }

    broadcastStoreChange();
  },

  resetDefaults() {
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.CLAIMS);
    broadcastStoreChange();
  },
};

/**
 * Custom React Hook to consume reactive store state
 */
export function useMockStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((prev) => prev + 1);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return {
    items: mockStore.getItems(),
    notifications: mockStore.getNotifications(),
    claims: mockStore.getClaims(),
    addItem: (item) => mockStore.addItem(item),
    markNotificationRead: (id) => mockStore.markNotificationRead(id),
    markAllNotificationsRead: () => mockStore.markAllNotificationsRead(),
    clearNotifications: () => mockStore.clearNotifications(),
    updateClaimStatus: (id, status) => mockStore.updateClaimStatus(id, status),
    resetDefaults: () => mockStore.resetDefaults(),
  };
}
