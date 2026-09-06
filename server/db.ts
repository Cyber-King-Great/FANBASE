import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('Error reading firebase-applet-config.json on server:', e);
}

const serverApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const serverDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(serverApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(serverApp);

// Default Disclaimer text
export const DEFAULT_DISCLAIMER =
  'GRAMMY® is a trademark of The Recording Academy. This website is an independent fan prediction platform and is not affiliated with, sponsored by, or endorsed by The Recording Academy.';

// Helper to sanitize doc data
function formatDoc(d: any) {
  if (!d.exists()) return null;
  const data = d.data();
  return { id: d.id, ...data };
}

export async function getSettings() {
  try {
    const sDoc = await getDoc(doc(serverDb, 'settings', 'app'));
    if (sDoc.exists()) {
      return sDoc.data();
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
  }
  return {
    disclaimer: DEFAULT_DISCLAIMER,
    allowAnonymousVoting: true,
    siteTitle: 'Fanbase - Who deserves a GRAMMY nomination?',
    updatedAt: new Date().toISOString()
  };
}

export async function getCurrentCampaign() {
  try {
    const campaignsCol = collection(serverDb, 'campaigns');
    const q = query(campaignsCol, where('status', '==', 'ACTIVE'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return formatDoc(snap.docs[0]);
    }
  } catch (err) {
    console.error('Error getting current campaign:', err);
  }
  // Return default active campaign structure
  return {
    id: 'grammy-2027',
    name: 'GRAMMY 2027 Fan Predictions',
    slug: 'grammy-2027',
    description: 'Predict the artists, albums and songs you believe deserve recognition for the 2027 GRAMMYs.',
    eventName: 'GRAMMY Awards',
    eventYear: 2027,
    currentPhase: 'NOMINATION_PREDICTION',
    status: 'ACTIVE',
    brandingConfig: {
      tagline: 'Who deserves a GRAMMY nomination?'
    },
    disclaimer: DEFAULT_DISCLAIMER
  };
}

export async function getOverviewStats() {
  const campaign = await getCurrentCampaign();
  const campaignId = campaign.id || 'grammy-2027';

  let totalVotes = 0;
  let totalCategories = 0;
  let totalCandidates = 0;
  let countriesCount = 0;

  try {
    const statsDoc = await getDoc(doc(serverDb, 'campaignStats', campaignId));
    if (statsDoc.exists()) {
      totalVotes = statsDoc.data().totalVotes || 0;
    }

    const catSnap = await getDocs(query(collection(serverDb, 'categories'), where('status', '==', 'ACTIVE')));
    totalCategories = catSnap.size;

    const candSnap = await getDocs(query(collection(serverDb, 'candidates'), where('status', '==', 'ACTIVE')));
    totalCandidates = candSnap.size;

    const countrySnap = await getDocs(collection(serverDb, 'countryStats'));
    countriesCount = countrySnap.size;
  } catch (e) {
    console.error('Error fetching overview stats from Firestore:', e);
  }

  return {
    campaign,
    totalVotes,
    totalCategories,
    totalCandidates,
    countriesCount
  };
}

export async function getCategories() {
  try {
    const snap = await getDocs(
      query(collection(serverDb, 'categories'), where('status', '==', 'ACTIVE'), orderBy('displayOrder', 'asc'))
    );
    const categories = snap.docs.map(formatDoc);

    // Fetch stats for each category
    const catStatsSnap = await getDocs(collection(serverDb, 'categoryStats'));
    const statsMap = new Map();
    catStatsSnap.forEach((d) => statsMap.set(d.id, d.data()));

    return categories.map((cat: any) => {
      const stat = statsMap.get(cat.id) || { totalVotes: 0 };
      return {
        ...cat,
        totalVotes: stat.totalVotes || 0,
        leadingCandidateId: stat.leadingCandidateId || null,
        leadingCandidateName: stat.leadingCandidateName || null,
        leadingPercentage: stat.leadingPercentage || 0
      };
    });
  } catch (err) {
    console.error('Error getting categories:', err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const snap = await getDocs(query(collection(serverDb, 'categories'), where('slug', '==', slug), limit(1)));
    if (snap.empty) return null;
    const category: any = formatDoc(snap.docs[0]);

    // Fetch candidateCategories relationships for this category
    const ccSnap = await getDocs(
      query(
        collection(serverDb, 'candidateCategories'),
        where('categoryId', '==', category.id),
        where('displayStatus', '==', 'VISIBLE'),
        orderBy('displayOrder', 'asc')
      )
    );

    const candidateIds = ccSnap.docs.map((d) => d.data().candidateId);
    let candidates: any[] = [];

    if (candidateIds.length > 0) {
      // Fetch candidates
      const candPromises = candidateIds.map((cid) => getDoc(doc(serverDb, 'candidates', cid)));
      const candDocs = await Promise.all(candPromises);
      candidates = candDocs.filter((d) => d.exists()).map(formatDoc);
    }

    // Fetch category stats
    const catStatDoc = await getDoc(doc(serverDb, 'categoryStats', category.id));
    const catTotalVotes = catStatDoc.exists() ? catStatDoc.data().totalVotes || 0 : 0;

    // Fetch candidateStats for these candidates in this category
    const statsWithCandidate = await Promise.all(
      candidates.map(async (cand) => {
        const statKey = `${category.id}_${cand.id}`;
        const sDoc = await getDoc(doc(serverDb, 'candidateStats', statKey));
        const votes = sDoc.exists() ? sDoc.data().votes || 0 : 0;
        const percentage = catTotalVotes > 0 ? Math.round((votes / catTotalVotes) * 100) : 0;
        return {
          ...cand,
          votes,
          percentage
        };
      })
    );

    // Sort by votes descending, then assign rank
    statsWithCandidate.sort((a, b) => b.votes - a.votes);
    const rankedCandidates = statsWithCandidate.map((c, idx) => ({
      ...c,
      rank: idx + 1
    }));

    return {
      category: {
        ...category,
        totalVotes: catTotalVotes
      },
      candidates: rankedCandidates
    };
  } catch (err) {
    console.error('Error fetching category by slug:', err);
    return null;
  }
}

export async function getLeaderboard(categoryId?: string) {
  try {
    if (categoryId) {
      const catDoc = await getDoc(doc(serverDb, 'categories', categoryId));
      if (!catDoc.exists()) return [];
      const categoryData: any = formatDoc(catDoc);

      const res = await getCategoryBySlug(categoryData.slug);
      return res ? res.candidates : [];
    }

    // Global overall candidates ranking across all categories
    const allCandsSnap = await getDocs(query(collection(serverDb, 'candidates'), where('status', '==', 'ACTIVE')));
    const candidates = allCandsSnap.docs.map(formatDoc);

    const statsSnap = await getDocs(collection(serverDb, 'candidateStats'));
    const voteSumMap = new Map<string, number>();
    statsSnap.forEach((d) => {
      const data = d.data();
      const cId = data.candidateId;
      const count = data.votes || 0;
      if (cId) {
        voteSumMap.set(cId, (voteSumMap.get(cId) || 0) + count);
      }
    });

    let totalGlobalVotes = 0;
    const ranked = candidates.map((cand: any) => {
      const votes = voteSumMap.get(cand.id) || 0;
      totalGlobalVotes += votes;
      return {
        ...cand,
        votes
      };
    });

    ranked.sort((a, b) => b.votes - a.votes);
    return ranked.map((c, idx) => ({
      ...c,
      percentage: totalGlobalVotes > 0 ? Math.round((c.votes / totalGlobalVotes) * 100) : 0,
      rank: idx + 1
    }));
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
}

export async function getCountries() {
  try {
    const snap = await getDocs(query(collection(serverDb, 'countryStats'), orderBy('totalVotes', 'desc')));
    return snap.docs.map(formatDoc);
  } catch (err) {
    console.error('Error getting country stats:', err);
    return [];
  }
}

export async function getCountryDetail(countryCode: string) {
  try {
    const code = countryCode.toUpperCase();
    const cDoc = await getDoc(doc(serverDb, 'countryStats', code));
    if (!cDoc.exists()) {
      return {
        countryCode: code,
        countryName: code,
        totalVotes: 0,
        topCandidateName: null
      };
    }
    return formatDoc(cDoc);
  } catch (err) {
    console.error('Error fetching country detail:', err);
    return null;
  }
}

export async function getArtistBySlug(slug: string) {
  try {
    const snap = await getDocs(query(collection(serverDb, 'artists'), where('slug', '==', slug), limit(1)));
    if (snap.empty) return null;
    const artist: any = formatDoc(snap.docs[0]);

    // Fetch songs, albums, nominations/candidates for this artist
    const [songsSnap, albumsSnap, candsSnap] = await Promise.all([
      getDocs(query(collection(serverDb, 'songs'), where('artistId', '==', artist.id))),
      getDocs(query(collection(serverDb, 'albums'), where('artistId', '==', artist.id))),
      getDocs(query(collection(serverDb, 'candidates'), where('artistId', '==', artist.id)))
    ]);

    const songs = songsSnap.docs.map(formatDoc);
    const albums = albumsSnap.docs.map(formatDoc);
    const candidates = candsSnap.docs.map(formatDoc);

    return {
      artist,
      songs,
      albums,
      candidates
    };
  } catch (err) {
    console.error('Error fetching artist:', err);
    return null;
  }
}

export async function getArticles(onlyPublished = true) {
  try {
    let q;
    if (onlyPublished) {
      q = query(collection(serverDb, 'articles'), where('published', '==', true), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(serverDb, 'articles'), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(formatDoc);
  } catch (err) {
    console.error('Error fetching articles:', err);
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const snap = await getDocs(query(collection(serverDb, 'articles'), where('slug', '==', slug), limit(1)));
    if (snap.empty) return null;
    return formatDoc(snap.docs[0]);
  } catch (err) {
    console.error('Error fetching article:', err);
    return null;
  }
}

export async function getAdSlots() {
  try {
    const snap = await getDocs(collection(serverDb, 'adSlots'));
    return snap.docs.map(formatDoc);
  } catch (err) {
    console.error('Error fetching ad slots:', err);
    return [];
  }
}

export async function submitVote(payload: {
  campaignId: string;
  categoryId: string;
  candidateId: string;
  userId?: string;
  anonymousSessionId?: string;
  country?: string;
  countryCode?: string;
}) {
  const { campaignId, categoryId, candidateId, userId, anonymousSessionId } = payload;
  const voterKey = userId ? `user_${userId}` : anonymousSessionId ? `anon_${anonymousSessionId}` : null;

  if (!campaignId || !categoryId || !candidateId || !voterKey) {
    return { success: false, error: 'INVALID_INPUT', message: 'Missing voting parameters.' };
  }

  // Country defaults
  const countryCode = (payload.countryCode || 'US').toUpperCase();
  const country = payload.country || 'United States';

  // Duplicate Check Key
  const duplicateId = `${campaignId}_${categoryId}_${voterKey}`;
  const voteDocRef = doc(serverDb, 'votes', duplicateId);

  // References for Stats
  const campaignStatRef = doc(serverDb, 'campaignStats', campaignId);
  const categoryStatRef = doc(serverDb, 'categoryStats', categoryId);
  const statKey = `${categoryId}_${candidateId}`;
  const candidateStatRef = doc(serverDb, 'candidateStats', statKey);
  const countryStatRef = doc(serverDb, 'countryStats', countryCode);

  try {
    const result = await runTransaction(serverDb, async (transaction) => {
      const existingVote = await transaction.get(voteDocRef);
      if (existingVote.exists()) {
        throw new Error('DUPLICATE_VOTE');
      }

      // Read Category to verify active
      const catDocRef = doc(serverDb, 'categories', categoryId);
      const catSnap = await transaction.get(catDocRef);
      if (!catSnap.exists() || catSnap.data().status !== 'ACTIVE') {
        throw new Error('CATEGORY_INACTIVE');
      }

      // Read Candidate
      const candDocRef = doc(serverDb, 'candidates', candidateId);
      const candSnap = await transaction.get(candDocRef);
      if (!candSnap.exists() || candSnap.data().status !== 'ACTIVE') {
        throw new Error('CANDIDATE_INACTIVE');
      }

      // Create Vote Doc
      transaction.set(voteDocRef, {
        campaignId,
        categoryId,
        candidateId,
        userId: userId || null,
        anonymousSessionId: anonymousSessionId || null,
        voterKey,
        country,
        countryCode,
        status: 'VALID',
        riskScore: 0,
        createdAt: new Date().toISOString()
      });

      // Increment Campaign Stats
      transaction.set(
        campaignStatRef,
        {
          campaignId,
          totalVotes: increment(1),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Increment Category Stats
      transaction.set(
        categoryStatRef,
        {
          categoryId,
          campaignId,
          totalVotes: increment(1),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Increment Candidate Stats
      transaction.set(
        candidateStatRef,
        {
          candidateId,
          categoryId,
          campaignId,
          votes: increment(1),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Increment Country Stats
      transaction.set(
        countryStatRef,
        {
          countryCode,
          countryName: country,
          totalVotes: increment(1),
          topCandidateName: candSnap.data().title || candSnap.data().subtitle,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      return {
        candidateName: candSnap.data().title,
        categoryName: catSnap.data().name
      };
    });

    return {
      success: true,
      voteId: duplicateId,
      message: `Vote recorded for ${result.candidateName}!`,
      candidateName: result.candidateName,
      categoryName: result.categoryName
    };
  } catch (err: any) {
    if (err.message === 'DUPLICATE_VOTE') {
      return {
        success: false,
        error: 'DUPLICATE_VOTE',
        message: 'You have already submitted your prediction for this category.'
      };
    }
    if (err.message === 'CATEGORY_INACTIVE') {
      return { success: false, error: 'CATEGORY_INACTIVE', message: 'This category is not currently open for voting.' };
    }
    if (err.message === 'CANDIDATE_INACTIVE') {
      return { success: false, error: 'CANDIDATE_INACTIVE', message: 'This candidate is not active.' };
    }
    console.error('Transaction error in submitVote:', err);
    return { success: false, error: 'VOTE_ERROR', message: 'Voting is temporarily unavailable. Please try again.' };
  }
}

export async function recordShare(payload: any) {
  try {
    const sCol = collection(serverDb, 'shareEvents');
    await setDoc(doc(sCol), {
      ...payload,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (e) {
    console.error('Error recording share:', e);
    return { success: false };
  }
}

export async function recordNewsletter(payload: { email: string; country?: string; favoriteArtist?: string }) {
  try {
    const emailKey = payload.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await setDoc(
      doc(serverDb, 'newsletterSubscribers', emailKey),
      {
        email: payload.email,
        country: payload.country || 'Unknown',
        favoriteArtist: payload.favoriteArtist || '',
        consent: true,
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );
    return { success: true, message: 'Subscribed successfully!' };
  } catch (e) {
    console.error('Error saving newsletter subscriber:', e);
    return { success: false, message: 'Subscription failed. Please try again.' };
  }
}

export async function recordAuditLog(adminEmail: string, action: string, target: string, details: any = {}) {
  try {
    const aCol = collection(serverDb, 'auditLogs');
    await setDoc(doc(aCol), {
      adminEmail,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error writing audit log:', e);
  }
}

export async function getAdminAnalytics() {
  try {
    const [votesSnap, suspSnap, usersSnap, articlesSnap, countriesSnap, catsSnap, candsSnap] = await Promise.all([
      getDocs(collection(serverDb, 'votes')),
      getDocs(collection(serverDb, 'suspiciousVotes')),
      getDocs(collection(serverDb, 'users')),
      getDocs(collection(serverDb, 'articles')),
      getDocs(collection(serverDb, 'countryStats')),
      getDocs(collection(serverDb, 'categories')),
      getDocs(collection(serverDb, 'candidates'))
    ]);

    const totalVotes = votesSnap.size;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let votesToday = 0;
    let votesThisWeek = 0;

    votesSnap.forEach((d) => {
      const data = d.data();
      if (data.createdAt) {
        const vDate = new Date(data.createdAt);
        if (vDate >= oneDayAgo) votesToday++;
        if (vDate >= oneWeekAgo) votesThisWeek++;
      }
    });

    return {
      totalVotes,
      votesToday,
      votesThisWeek,
      suspiciousCount: suspSnap.size,
      totalUsers: usersSnap.size,
      totalArticles: articlesSnap.size,
      totalCountries: countriesSnap.size,
      totalCategories: catsSnap.size,
      totalCandidates: candsSnap.size
    };
  } catch (err) {
    console.error('Error getting admin analytics:', err);
    return {
      totalVotes: 0,
      votesToday: 0,
      votesThisWeek: 0,
      suspiciousCount: 0,
      totalUsers: 0,
      totalArticles: 0,
      totalCountries: 0,
      totalCategories: 0,
      totalCandidates: 0
    };
  }
}
